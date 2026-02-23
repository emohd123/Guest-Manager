export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getDb } from "@/server/db";
import { orders, orderItems, ticketTypes } from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { sendRegistrationConfirmation } from "@/lib/resend";
import { format } from "date-fns";

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

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const {
      companyId,
      eventId,
      attendeeName,
      attendeeEmail,
      cartItems: cartItemsJson,
    } = session.metadata as {
      companyId: string;
      eventId: string;
      attendeeName: string;
      attendeeEmail: string;
      cartItems: string;
    };

    const cartItems = JSON.parse(cartItemsJson) as Array<{
      ticketTypeId: string;
      name: string;
      price: number;
      currency: string;
      quantity: number;
    }>;

    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    function generateOrderNumber(): string {
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `ORD-${timestamp}-${random}`;
    }

    const orderNumber = generateOrderNumber();

    try {
      const db = getDb();

      const order = await db
        .insert(orders)
        .values({
          companyId,
          eventId,
          orderNumber,
          status: "completed",
          email: attendeeEmail,
          name: attendeeName,
          subtotal,
          total: subtotal,
          currency: cartItems[0]?.currency ?? "USD",
          paymentMethod: "card",
          stripePaymentIntentId: session.payment_intent as string,
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

      // Send confirmation email
      try {
        await sendRegistrationConfirmation({
          to: attendeeEmail,
          attendeeName,
          eventTitle: session.metadata?.eventTitle ?? "Your Event",
          eventDate: session.metadata?.eventDate ?? "",
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
