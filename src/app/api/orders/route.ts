export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { companies, events, orders, orderItems, ticketTypes, tickets } from "@/server/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { generateAndSendTicket } from "@/server/actions/generateAndSendTicket";
import { nanoid } from "nanoid";

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companySlug, eventSlug, attendeeName, attendeeEmail, cartItems } = body as {
      companySlug: string;
      eventSlug: string;
      attendeeName: string;
      attendeeEmail: string;
      cartItems: Array<{
        ticketTypeId: string;
        name: string;
        price: number;
        currency: string;
        quantity: number;
      }>;
    };

    if (!companySlug || !eventSlug || !attendeeName || !attendeeEmail || !cartItems?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = getDb();

    // Look up company
    const company = await db
      .select({ id: companies.id, name: companies.name })
      .from(companies)
      .where(eq(companies.slug, companySlug))
      .limit(1);

    if (!company[0]) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Look up event
    const event = await db
      .select()
      .from(events)
      .where(
        and(
          eq(events.companyId, company[0].id),
          eq(events.slug, eventSlug),
          eq(events.status, "published")
        )
      )
      .limit(1);

    if (!event[0]) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (!event[0].registrationEnabled) {
      return NextResponse.json({ error: "Registration is not open" }, { status: 400 });
    }

    // Validate ticket types belong to this event
    const ticketTypeIds = cartItems.map((item) => item.ticketTypeId);
    const validTicketTypes = await db
      .select()
      .from(ticketTypes)
      .where(and(eq(ticketTypes.eventId, event[0].id)));

    const validIds = new Set(validTicketTypes.map((tt) => tt.id));
    for (const id of ticketTypeIds) {
      if (!validIds.has(id)) {
        return NextResponse.json({ error: "Invalid ticket type" }, { status: 400 });
      }
    }

    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const isFree = subtotal === 0;

    // For paid orders, create a Stripe Checkout Session instead
    if (!isFree) {
      const origin = request.nextUrl.origin;

      const lineItems = cartItems.map((item) => ({
        price_data: {
          currency: item.currency.toLowerCase(),
          product_data: {
            name: `${item.name} — ${event[0].title}`,
          },
          unit_amount: item.price,
        },
        quantity: item.quantity,
      }));

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        customer_email: attendeeEmail,
        metadata: {
          companyId: company[0].id,
          eventId: event[0].id,
          attendeeName,
          attendeeEmail,
          cartItems: JSON.stringify(cartItems),
        },
        success_url: `${origin}/e/${companySlug}/${eventSlug}?success=1&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/e/${companySlug}/${eventSlug}?cancelled=1`,
      });

      return NextResponse.json({ checkoutUrl: session.url });
    }

    // Free order — create directly
    const orderNumber = generateOrderNumber();

    const order = await db
      .insert(orders)
      .values({
        companyId: company[0].id,
        eventId: event[0].id,
        orderNumber,
        status: "completed",
        email: attendeeEmail,
        name: attendeeName,
        subtotal: 0,
        total: 0,
        currency: cartItems[0]?.currency ?? "USD",
        completedAt: new Date(),
      })
      .returning();

    await db.insert(orderItems).values(
      cartItems.map((item) => ({
        orderId: order[0].id,
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
    }

    // Create individual ticket records + send emails
    try {
      const origin = request.nextUrl.origin;
      for (const item of cartItems) {
        const ticketType = validTicketTypes.find(tt => tt.id === item.ticketTypeId);
        for (let i = 0; i < item.quantity; i++) {
          const barcode = `TKT-${nanoid(12).toUpperCase()}`;
          const [newTicket] = await db
            .insert(tickets)
            .values({
              companyId: company[0].id,
              eventId: event[0].id,
              ticketTypeId: item.ticketTypeId,
              orderId: order[0].id,
              barcode,
              attendeeName,
              attendeeEmail,
              status: "valid",
            })
            .returning();

          // Fire-and-forget: generate PDF + send email
          generateAndSendTicket({
            ticketId: newTicket.id,
            toEmail: attendeeEmail,
            attendeeName,
            ticketTypeName: ticketType?.name ?? item.name,
            orderNumber,
            barcode,
            eventName: event[0].title,
            eventStartsAt: event[0].startsAt,
            appBaseUrl: origin,
            eventSettings: event[0].settings,
          }).catch((e) => console.error("[orders] ticket send failed:", e));
        }
      }
    } catch (ticketErr) {
      console.error("Ticket creation error (non-fatal):", ticketErr);
    }

    return NextResponse.json({
      success: true,
      orderNumber,
      orderId: order[0].id,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
