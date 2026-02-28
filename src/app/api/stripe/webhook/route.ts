export const dynamic = "force-dynamic";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { getDb } from "@/server/db";
import { orders, orderItems, ticketTypes, guests, tickets, events } from "@/server/db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { sendRegistrationConfirmation } from "@/lib/resend";
import { generateAndSendTicket } from "@/server/actions/generateAndSendTicket";
import { format } from "date-fns";

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

    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
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
            .select({ id: ticketTypes.id, name: ticketTypes.name })
            .from(ticketTypes)
            .where(inArray(ticketTypes.id, ticketTypeIds))
        : [];

      const ticketTypeNameById = new Map(
        ticketTypeRows.map((row) => [row.id, row.name ?? "Ticket"])
      );

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

      const [order] = await db
        .insert(orders)
        .values({
          companyId,
          eventId,
          orderNumber,
          status: "completed",
          email: attendeeEmail,
          name: attendeeName ?? "Guest",
          subtotal,
          total: subtotal,
          currency: cartItems[0]?.currency ?? "USD",
          paymentMethod: "card",
          stripePaymentIntentId: paymentIntentId,
          completedAt: new Date(),
        })
        .returning();

      await db.insert(orderItems).values(
        cartItems.map((item) => ({
          orderId: order.id,
          ticketTypeId: item.ticketTypeId,
          quantity: item.quantity,
          unitPrice: item.price,
          total: item.price * item.quantity,
        }))
      );

      // Increment quantitySold
      for (const item of cartItems) {
        await db
          .update(ticketTypes)
          .set({
            quantitySold: sql`${ticketTypes.quantitySold} + ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(ticketTypes.id, item.ticketTypeId));

        // Paid checkouts also need attendee/guest/ticket records.
        for (let i = 0; i < item.quantity; i++) {
          const [firstName, ...lastNameParts] = (attendeeName ?? "Guest")
            .trim()
            .split(/\s+/)
            .filter(Boolean);

          const [guest] = await db
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
          const [ticket] = await db
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

          generateAndSendTicket({
            ticketId: ticket.id,
            toEmail: attendeeEmail,
            attendeeName: attendeeName ?? "Guest",
            ticketTypeName: ticketTypeNameById.get(item.ticketTypeId) ?? item.name,
            orderNumber,
            barcode,
            eventName: eventRow?.title ?? metadata.eventTitle ?? "Event",
            eventStartsAt: eventRow?.startsAt ?? new Date(),
            appBaseUrl: process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin,
            eventSettings: eventRow?.settings,
          }).catch((emailErr) => {
            console.error("Failed to generate/send paid ticket email:", emailErr);
          });
        }
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
          })),
          total: subtotal,
          isFree: false,
        });
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
      }

      console.log(`Order ${orderNumber} created for session ${session.id}`);
    } catch (dbError) {
      console.error("Failed to create order from webhook:", dbError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
