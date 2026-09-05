export const dynamic = "force-dynamic";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { fromStripeUnitAmount } from "@/lib/marketplace";
import { getDb } from "@/server/db";
import { orders, orderItems, ticketTypes, guests, tickets, events } from "@/server/db/schema";
import { eq, inArray, and, sql } from "drizzle-orm";
import { sendRegistrationConfirmation } from "@/lib/resend";
import { generateAndSendTicket } from "@/server/actions/generateAndSendTicket";
import { format } from "date-fns";
import { getAppUrl } from "@/lib/app-urls";

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

type CartItem = {
  ticketTypeId: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
};

function normalizeQuantity(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value > 0 && value <= 50 ? value : null;
}

class CheckoutFulfillmentError extends Error {}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let stripe;
  try {
    stripe = getStripeClient();
  } catch (err) {
    console.error("Stripe configuration error:", err);
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const metadata = session.metadata ?? {};
    const {
      companyId,
      eventId,
      attendeeName,
      attendeeEmail,
      cartItems: cartItemsJson,
    } = metadata as Record<string, string>;

    if (!companyId || !eventId || !attendeeEmail || !cartItemsJson) {
      console.error("Missing Stripe metadata for checkout completion:", {
        sessionId: session.id,
        companyId,
        eventId,
      });
      return NextResponse.json({ received: true });
    }

    let cartItems: CartItem[] = [];
    try {
      cartItems = JSON.parse(cartItemsJson) as CartItem[];
    } catch (parseError) {
      console.error("Failed to parse cart items from Stripe metadata:", parseError);
      return NextResponse.json({ received: true });
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      console.error("No cart items found in Stripe metadata:", { sessionId: session.id });
      return NextResponse.json({ received: true });
    }

    const paymentIntentId =
      typeof session.payment_intent === "string" ? session.payment_intent : null;

    if (!paymentIntentId) {
      console.error("Missing payment intent in completed checkout session:", {
        sessionId: session.id,
      });
      return NextResponse.json({ received: true });
    }

    if (cartItems.some((item) => normalizeQuantity(item.quantity) == null)) {
      console.error("Invalid quantity in Stripe metadata:", { sessionId: session.id });
      return NextResponse.json({ received: true });
    }

    const checkoutCurrency = (session.currency ?? cartItems[0]?.currency ?? "BHD").toUpperCase();
    const metadataTicketSubtotal = Number(metadata.ticketSubtotal);
    const subtotal = Number.isFinite(metadataTicketSubtotal)
      ? metadataTicketSubtotal
      : fromStripeUnitAmount(session.amount_subtotal ?? session.amount_total ?? 0, checkoutCurrency);
    const total = fromStripeUnitAmount(session.amount_total ?? session.amount_subtotal ?? 0, checkoutCurrency);
    const db = getDb();

    try {
      // Stripe may retry this event; avoid duplicate orders/fulfillment.
      const existingOrder = await db
        .select({ id: orders.id, orderNumber: orders.orderNumber })
        .from(orders)
        .where(eq(orders.stripePaymentIntentId, paymentIntentId))
        .limit(1);

      if (existingOrder[0]) {
        console.log(
          `Skipping duplicate webhook for session ${session.id}; order ${existingOrder[0].orderNumber} already exists.`
        );
        return NextResponse.json({ received: true });
      }

      const ticketTypeIds = [...new Set(cartItems.map((item) => item.ticketTypeId))];
      const ticketTypeRows = ticketTypeIds.length
        ? await db
            .select({
              id: ticketTypes.id,
              name: ticketTypes.name,
              price: ticketTypes.price,
              currency: ticketTypes.currency,
              status: ticketTypes.status,
              quantityTotal: ticketTypes.quantityTotal,
              quantitySold: ticketTypes.quantitySold,
              saleStartsAt: ticketTypes.saleStartsAt,
              saleEndsAt: ticketTypes.saleEndsAt,
              minPerOrder: ticketTypes.minPerOrder,
              maxPerOrder: ticketTypes.maxPerOrder,
            })
            .from(ticketTypes)
            .where(and(inArray(ticketTypes.id, ticketTypeIds), eq(ticketTypes.companyId, companyId), eq(ticketTypes.eventId, eventId)))
        : [];

      const ticketTypeNameById = new Map(
        ticketTypeRows.map((row) => [row.id, row.name ?? "Ticket"])
      );
      const ticketTypeById = new Map(ticketTypeRows.map((row) => [row.id, row]));

      const now = new Date();
      for (const item of cartItems) {
        const ticketType = ticketTypeById.get(item.ticketTypeId);
        if (!ticketType) {
          throw new CheckoutFulfillmentError("Stripe session references an invalid ticket type.");
        }
        const saleStartsAt = ticketType.saleStartsAt ? new Date(ticketType.saleStartsAt) : null;
        const saleEndsAt = ticketType.saleEndsAt ? new Date(ticketType.saleEndsAt) : null;
        const remaining =
          ticketType.quantityTotal == null
            ? Number.POSITIVE_INFINITY
            : ticketType.quantityTotal - (ticketType.quantitySold ?? 0);
        const minPerOrder = ticketType.minPerOrder ?? 1;
        const maxPerOrder = ticketType.maxPerOrder ?? 10;

        if (ticketType.status !== "active") {
          throw new CheckoutFulfillmentError(`${ticketType.name} is not available.`);
        }
        if (saleStartsAt && saleStartsAt > now) {
          throw new CheckoutFulfillmentError(`${ticketType.name} is not on sale yet.`);
        }
        if (saleEndsAt && saleEndsAt < now) {
          throw new CheckoutFulfillmentError(`${ticketType.name} sales have ended.`);
        }
        if (item.quantity < minPerOrder || item.quantity > maxPerOrder || item.quantity > remaining) {
          throw new CheckoutFulfillmentError(`${ticketType.name} is no longer available in that quantity.`);
        }

        item.name = ticketType.name ?? item.name;
        item.price = ticketType.price ?? item.price;
        item.currency = ticketType.currency ?? checkoutCurrency;
      }

      const [eventRow] = await db
        .select({
          title: events.title,
          startsAt: events.startsAt,
          settings: events.settings,
        })
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);

      const orderNumber = generateOrderNumber();
      const seatHoldToken = metadata.seatHoldToken || null;
      const ticketTasks: Array<{
        ticketId: string;
        barcode: string;
        ticketTypeName: string;
      }> = [];

      await db.transaction(async (tx) => {
        const [order] = await tx
          .insert(orders)
          .values({
            companyId,
            eventId,
            orderNumber,
            status: "completed",
            email: attendeeEmail,
            name: attendeeName ?? "Guest",
            subtotal,
            total,
            currency: checkoutCurrency,
            paymentMethod: "card",
            stripePaymentIntentId: paymentIntentId,
            completedAt: new Date(),
          })
          .returning();

        await tx.insert(orderItems).values(
          cartItems.map((item) => ({
            orderId: order.id,
            ticketTypeId: item.ticketTypeId,
            quantity: item.quantity,
            unitPrice: item.price,
            total: item.price * item.quantity,
          }))
        );

        for (const item of cartItems) {
          const updatedTicketType = await tx
            .update(ticketTypes)
            .set({
              quantitySold: sql`${ticketTypes.quantitySold} + ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(ticketTypes.id, item.ticketTypeId),
                eq(ticketTypes.status, "active"),
                sql`(${ticketTypes.quantityTotal} IS NULL OR ${ticketTypes.quantitySold} + ${item.quantity} <= ${ticketTypes.quantityTotal})`
              )
            )
            .returning({ id: ticketTypes.id });

          if (!updatedTicketType[0]) {
            throw new CheckoutFulfillmentError(`${item.name} is no longer available.`);
          }

          for (let i = 0; i < item.quantity; i++) {
            const [firstName, ...lastNameParts] = (attendeeName ?? "Guest")
              .trim()
              .split(/\s+/)
              .filter(Boolean);

            const [guest] = await tx
              .insert(guests)
              .values({
                companyId,
                eventId,
                firstName: firstName || "Guest",
                lastName: lastNameParts.join(" "),
                email: attendeeEmail,
                status: "confirmed",
                guestType: ticketTypeNameById.get(item.ticketTypeId) ?? item.name,
              })
              .returning();

            const barcode = `TKT-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
            const [ticket] = await tx
              .insert(tickets)
              .values({
                companyId,
                eventId,
                ticketTypeId: item.ticketTypeId,
                orderId: order.id,
                guestId: guest.id,
                barcode,
                attendeeName: attendeeName ?? "Guest",
                attendeeEmail,
                status: "valid",
              })
              .returning({ id: tickets.id });

            ticketTasks.push({
              ticketId: ticket.id,
              barcode,
              ticketTypeName: ticketTypeNameById.get(item.ticketTypeId) ?? item.name,
            });
          }
        }

        if (seatHoldToken) {
          await tx.execute(sql`select finalize_seat_hold(
            ${seatHoldToken}::uuid,
            ${order.id}::uuid,
            ${ticketTasks.map((task) => task.ticketId)}::uuid[]
          )`);
        }
      });

      for (const task of ticketTasks) {
        generateAndSendTicket({
          ticketId: task.ticketId,
          toEmail: attendeeEmail,
          attendeeName: attendeeName ?? "Guest",
          ticketTypeName: task.ticketTypeName,
          orderNumber,
          barcode: task.barcode,
          eventName: eventRow?.title ?? metadata.eventTitle ?? "Event",
          eventStartsAt: eventRow?.startsAt ?? new Date(),
          appBaseUrl: getAppUrl(),
          eventSettings: eventRow?.settings,
        }).catch((emailErr) => {
          console.error("Failed to generate/send paid ticket email:", emailErr);
        });
      }

      // Send confirmation email
      try {
        await sendRegistrationConfirmation({
          to: attendeeEmail,
          attendeeName: attendeeName ?? "Guest",
          eventTitle: eventRow?.title ?? metadata.eventTitle ?? "Your Event",
          eventDate: eventRow?.startsAt
            ? format(new Date(eventRow.startsAt), "PPP p")
            : metadata.eventDate ?? "",
          orderNumber,
          tickets: cartItems.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            currency: item.currency,
          })),
          total,
          currency: checkoutCurrency,
          isFree: false,
        });
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
      }

      console.log(`Order ${orderNumber} created for session ${session.id}`);
    } catch (dbError) {
      if (dbError instanceof CheckoutFulfillmentError) {
        console.error("Failed to fulfill paid checkout:", {
          sessionId: session.id,
          reason: dbError.message,
        });
        return NextResponse.json({ received: true });
      }
      console.error("Failed to create order from webhook:", dbError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
