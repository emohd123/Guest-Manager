export const dynamic = "force-dynamic";

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { and, eq, ilike, sql } from "drizzle-orm";
import { getStripeClient } from "@/lib/stripe";
import { toStripeUnitAmount } from "@/lib/marketplace";
import { getDb } from "@/server/db";
import {
  companies,
  events,
  guests,
  orderItems,
  orders,
  ticketTypes,
  tickets,
  promotions,
} from "@/server/db/schema";
import { generateAndSendTicket } from "@/server/actions/generateAndSendTicket";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { bookSeatsIoObjects, readSeatsIoChartKey, readSeatsIoEventKey, readSeatsIoObjectInfos, readSeatsIoPricing, releaseSeatsIoObjects, seatsIoEventKeyFor } from "@/lib/seatsio";

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

function normalizeQuantity(value: unknown) {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0 &&
    value <= 50
    ? value
    : null;
}

class CheckoutValidationError extends Error {}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const authorization = request.headers.get("authorization");
    const bearerToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    const { data: authData } = bearerToken
      ? await supabase.auth.getUser(bearerToken)
      : await supabase.auth.getUser();
    const buyer = authData.user;
    if (!buyer) {
      return NextResponse.json(
        { error: "Please sign in before purchasing tickets.", code: "AUTH_REQUIRED" },
        { status: 401 },
      );
    }
    const body = await request.json();
    const {
      companySlug,
      eventSlug,
      eventId: requestedEventId,
      attendeeName,
      attendeeEmail,
      cartItems: requestedCartItems,
      selectedSeatIds,
      seatHoldToken,
      seatsIo,
      promoCode,
    } = body as {
      companySlug?: string;
      eventSlug?: string;
      eventId?: string;
      attendeeName: string;
      attendeeEmail: string;
      cartItems?: Array<{
        ticketTypeId: string;
        name: string;
        price: number;
        currency: string;
        quantity: number;
      }>;
      selectedSeatIds?: string[];
      seatHoldToken?: string;
      seatsIo?: boolean;
      promoCode?: string;
    };

    const buyerName =
      typeof buyer.user_metadata?.full_name === "string"
        ? buyer.user_metadata.full_name
        : typeof buyer.user_metadata?.name === "string"
          ? buyer.user_metadata.name
          : "Guest";
    const resolvedAttendeeName = attendeeName?.trim() || buyerName;
    const resolvedAttendeeEmail = attendeeEmail?.trim() || buyer.email || "";

    // Seats.io selections are external object IDs and must use the event's
    // active ticket type. The browser price/ID is only a display hint; resolve
    // the real catalog row below after the event has been located.
    let cartItems = requestedCartItems ?? [];
    if (!cartItems.length && requestedEventId && selectedSeatIds?.length) {
      const fallbackTicketType = await getDb()
        .select()
        .from(ticketTypes)
        .where(and(eq(ticketTypes.eventId, requestedEventId), eq(ticketTypes.status, "active")))
        .limit(1);
      const type = fallbackTicketType[0];
      if (!type) return NextResponse.json({ error: "No active ticket type is configured for this event." }, { status: 400 });
      cartItems = [{ ticketTypeId: type.id, name: type.name, price: type.price ?? 0, currency: type.currency ?? "EGP", quantity: selectedSeatIds.length }];
    }

    if ((!companySlug || !eventSlug) && !requestedEventId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const db = getDb();
    const company = companySlug
      ? await db.select({ id: companies.id, name: companies.name }).from(companies).where(eq(companies.slug, companySlug)).limit(1)
      : [];
    const event = requestedEventId
      ? await db.select().from(events).where(and(eq(events.id, requestedEventId), eq(events.status, "published"))).limit(1)
      : company[0]
        ? await db.select().from(events).where(and(eq(events.companyId, company[0].id), eq(events.slug, eventSlug!), eq(events.status, "published"))).limit(1)
        : [];

    if (!event[0]) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    const resolvedCompany = company[0]
      ? company[0]
      : (await db.select({ id: companies.id, name: companies.name }).from(companies).where(eq(companies.id, event[0].companyId)).limit(1))[0];
    if (!resolvedCompany) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    // A selected seat is authoritative evidence that this is a seating
    // checkout. Do not rely solely on the client-side `seatsIo` marker: older
    // links, browser restores, and third-party chart redirects can drop that
    // flag. Always resolve the ticket type from the same published event so a
    // seat can never be booked against a different event's ticket type.
    if (selectedSeatIds?.length) {
      const activeTicketTypes = await db
        .select()
        .from(ticketTypes)
        .where(and(eq(ticketTypes.eventId, event[0].id), eq(ticketTypes.status, "active")));
      const requestedTypeId = requestedCartItems?.[0]?.ticketTypeId;
      const type =
        activeTicketTypes.find((record) => record.id === requestedTypeId) ??
        activeTicketTypes.find((record) => Number(record.price ?? 0) === 0) ??
        activeTicketTypes[0];
      if (!type) {
        return NextResponse.json({ error: "No active ticket type is configured for this event." }, { status: 400 });
      }
      const fallbackPrice = Number(type.price ?? 0);
      const seatsIoChartKey = readSeatsIoChartKey(event[0].settings);
      const seatsIoEventKey = readSeatsIoEventKey(event[0].settings) ?? (seatsIoChartKey ? seatsIoEventKeyFor(event[0].id, seatsIoChartKey) : event[0].id);
      const categoryPrices = readSeatsIoPricing(event[0].settings);
      const seatPrices = new Map<number, number>();
      if (categoryPrices.length) {
        const objectInfos = await readSeatsIoObjectInfos(seatsIoEventKey, selectedSeatIds);
        selectedSeatIds.forEach((seatId) => {
          const info = objectInfos[seatId] ?? {};
          const nestedCategory = info.category && typeof info.category === "object"
            ? (info.category as Record<string, unknown>) : null;
          const category = info.categoryKey ?? info.categoryLabel ?? nestedCategory?.key ?? nestedCategory?.label;
          const configured = categoryPrices.find((entry) => String(entry.category) === String(category));
          const price = configured?.price ?? fallbackPrice;
          seatPrices.set(price, (seatPrices.get(price) ?? 0) + 1);
        });
      } else {
        seatPrices.set(fallbackPrice, selectedSeatIds.length);
      }
      cartItems = Array.from(seatPrices, ([price, quantity]) => ({
        ticketTypeId: type.id,
        name: type.name,
        price,
        currency: type.currency ?? "EGP",
        quantity,
      }));
    }

    const eventSettings =
      event[0].settings && typeof event[0].settings === "object"
        ? (event[0].settings as Record<string, any>)
        : {};
    const isPaidEvent = eventSettings.publicPage?.isPaidEvent !== false;
    if (cartItems.some((item) => normalizeQuantity(item.quantity) == null)) {
      return NextResponse.json(
        { error: "Please choose a valid ticket quantity." },
        { status: 400 },
      );
    }

    const aggregatedCart = Array.from(
      cartItems
        .reduce((itemsByTicketType, item) => {
          const quantity = normalizeQuantity(item.quantity) ?? 0;
          const existing = itemsByTicketType.get(item.ticketTypeId);
          itemsByTicketType.set(item.ticketTypeId, {
            ...item,
            quantity: (existing?.quantity ?? 0) + quantity,
          });
          return itemsByTicketType;
        }, new Map<string, (typeof cartItems)[number]>())
        .values(),
    );

    if (aggregatedCart.length === 0) {
      return NextResponse.json(
        { error: "Please choose a valid ticket quantity." },
        { status: 400 },
      );
    }

    const ticketTypeIds = aggregatedCart.map((item) => item.ticketTypeId);
    const validTicketTypes = await db
      .select()
      .from(ticketTypes)
      .where(and(eq(ticketTypes.eventId, event[0].id)));
    const validIds = new Set(
      validTicketTypes.map((ticketType) => ticketType.id),
    );

    for (const id of ticketTypeIds) {
      if (!validIds.has(id)) {
        return NextResponse.json(
          { error: "Invalid ticket type" },
          { status: 400 },
        );
      }
    }

    // Free ticket types are reservations and must remain claimable even when
    // the paid registration switch is disabled. Decide this from the server's
    // catalog prices rather than trusting the client subtotal.
    const catalogSubtotal = aggregatedCart.reduce((sum, item) => {
      const ticketType = validTicketTypes.find((record) => record.id === item.ticketTypeId);
      const unitPrice = selectedSeatIds?.length ? item.price : (ticketType?.price ?? 0);
      return sum + unitPrice * item.quantity;
    }, 0);
    if (!event[0].registrationEnabled && isPaidEvent && catalogSubtotal > 0) {
      return NextResponse.json(
        { error: "Registration is not open" },
        { status: 400 },
      );
    }

    const now = new Date();
    const isReservedSeating = Boolean(selectedSeatIds?.length);
    const normalizedCartItems = aggregatedCart
      .map((item) => {
        const ticketType = validTicketTypes.find(
          (record) => record.id === item.ticketTypeId,
        );
        if (!ticketType) return null;
        const minPerOrder = ticketType.minPerOrder ?? 1;
        const maxPerOrder = ticketType.maxPerOrder ?? 10;
        const quantitySold = ticketType.quantitySold ?? 0;
        const remaining =
          ticketType.quantityTotal == null
            ? Number.POSITIVE_INFINITY
            : ticketType.quantityTotal - quantitySold;
        const saleStartsAt = ticketType.saleStartsAt
          ? new Date(ticketType.saleStartsAt)
          : null;
        const saleEndsAt = ticketType.saleEndsAt
          ? new Date(ticketType.saleEndsAt)
          : null;

        if (ticketType.status !== "active") {
          throw new CheckoutValidationError(
            `${ticketType.name} is not available.`,
          );
        }
        if (saleStartsAt && saleStartsAt > now) {
          throw new CheckoutValidationError(
            `${ticketType.name} is not on sale yet.`,
          );
        }
        if (saleEndsAt && saleEndsAt < now) {
          throw new CheckoutValidationError(
            `${ticketType.name} sales have ended.`,
          );
        }
        if (!isReservedSeating && (item.quantity < minPerOrder || item.quantity > maxPerOrder)) {
          throw new CheckoutValidationError(
            `${ticketType.name} allows ${minPerOrder}-${maxPerOrder} tickets per order.`,
          );
        }
        if (!isReservedSeating && item.quantity > remaining) {
          throw new CheckoutValidationError(
            `${ticketType.name} is sold out or has limited availability.`,
          );
        }

        return {
          ...item,
          name: ticketType.name ?? item.name,
          currency: ticketType.currency ?? item.currency,
          price: isPaidEvent
            ? selectedSeatIds?.length
              ? item.price
              : (ticketType.price ?? item.price)
            : 0,
        };
      })
      .filter(Boolean) as Array<
      (typeof aggregatedCart)[number] & {
        price: number;
        currency: string;
        name: string;
      }
    >;

    const requestedQuantity = normalizedCartItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    let selectedSeats: Array<{
      id: string;
      label: string;
      row_label: string;
      section_name: string;
      price: number;
    }> = [];
    if (seatHoldToken) {
      if (!seatHoldToken || selectedSeatIds?.length !== requestedQuantity) {
        return NextResponse.json(
          { error: "Choose one available seat for every ticket." },
          { status: 400 },
        );
      }
      const result = await db.execute(sql`
        SELECT rs.id,rs.label,sr.label row_label,ss.name section_name,COALESCE(rs.price,sr.price,ss.price)::int price
        FROM reserved_seats rs JOIN seat_rows sr ON sr.id=rs.row_id JOIN seat_sections ss ON ss.id=sr.section_id
        JOIN seating_plans sp ON sp.id=ss.plan_id JOIN seat_holds sh ON sh.seat_id=rs.id
        WHERE sp.event_id=${event[0].id} AND rs.id=ANY(${selectedSeatIds}::uuid[]) AND rs.sold_ticket_id IS NULL AND rs.inventory_status='available'
          AND sh.hold_token=${seatHoldToken}::uuid AND sh.status='pending' AND sh.expires_at>now()
        ORDER BY ss.sort_order,sr.sort_order,rs.label`);
      selectedSeats = result as unknown as typeof selectedSeats;
      if (selectedSeats.length !== requestedQuantity)
        return NextResponse.json(
          {
            error:
              "Your seat hold expired or a seat is unavailable. Please select again.",
          },
          { status: 409 },
        );
      const ticketFallbackPrices = normalizedCartItems.flatMap((item) =>
        Array.from({ length: item.quantity }, () => item.price),
      );
      selectedSeats = selectedSeats.map((seat, index) => ({
        ...seat,
        price: seat.price ?? ticketFallbackPrices[index] ?? 0,
      }));
    }

    const grossSubtotal = selectedSeats.length
      ? selectedSeats.reduce((sum, seat) => sum + seat.price, 0)
      : normalizedCartItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );
    let appliedPromo: typeof promotions.$inferSelect | null = null;
    if (promoCode?.trim()) {
      const promoRows = await db.select().from(promotions).where(and(eq(promotions.companyId, resolvedCompany.id), eq(promotions.eventId, event[0].id), ilike(promotions.code, promoCode.trim()), eq(promotions.isActive, true))).limit(1);
      const promo = promoRows[0];
      if (!promo || (promo.startsAt && promo.startsAt > now) || (promo.endsAt && promo.endsAt < now)) throw new CheckoutValidationError("This promo code is not active.");
      if (promo.maxUses != null && requestedQuantity > promo.maxUses) throw new CheckoutValidationError(`This promo code is limited to ${promo.maxUses} tickets.`);
      appliedPromo = promo;
    }
    const discountPercentage = appliedPromo?.discountType === "percentage" ? Math.min(100, Math.max(0, Number(appliedPromo.value))) : 0;
    const discountFactor = 1 - discountPercentage / 100;
    const subtotal = grossSubtotal * discountFactor;
    const currencies = [
      ...new Set(
        normalizedCartItems.map((item) => item.currency.toUpperCase()),
      ),
    ];
    if (currencies.length > 1) {
      return NextResponse.json(
        { error: "Please checkout one currency at a time." },
        { status: 400 },
      );
    }

    if (subtotal > 0) {
      const stripe = getStripeClient();
      const origin = request.nextUrl.origin;
      const serviceFee = subtotal * 0.1;
      const lineItems = selectedSeats.length
        ? selectedSeats.map((seat) => ({
            price_data: {
              currency: currencies[0].toLowerCase(),
              product_data: {
                name: `${event[0].title} — ${seat.section_name}, Row ${seat.row_label}, Seat ${seat.label}`,
              },
              unit_amount: toStripeUnitAmount(seat.price * discountFactor, currencies[0]),
            },
            quantity: 1,
          }))
        : normalizedCartItems.map((item) => ({
            price_data: {
              currency: item.currency.toLowerCase(),
              product_data: {
                name: `${item.name} - ${event[0].title}`,
              },
              unit_amount: toStripeUnitAmount(item.price * discountFactor, item.currency),
            },
            quantity: item.quantity,
          }));

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          ...lineItems,
          {
            price_data: {
              currency: currencies[0].toLowerCase(),
              product_data: { name: "iTicket service fee (10%)" },
              unit_amount: toStripeUnitAmount(serviceFee, currencies[0]),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        customer_email: resolvedAttendeeEmail,
        metadata: {
          companyId: resolvedCompany.id,
          eventId: event[0].id,
          attendeeName: resolvedAttendeeName,
          attendeeEmail: resolvedAttendeeEmail,
          cartItems: JSON.stringify(normalizedCartItems),
          seatHoldToken: seatHoldToken ?? "",
          ticketSubtotal: String(subtotal),
          serviceFee: String(serviceFee),
          promoCode: appliedPromo?.code ?? "",
          discountPercentage: String(discountPercentage),
        },
        success_url: `${origin}/e/${companySlug}/${eventSlug}?success=1&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/e/${companySlug}/${eventSlug}?cancelled=1`,
      });

      return NextResponse.json({ checkoutUrl: session.url });
    }

    const orderNumber = generateOrderNumber();
    const origin = request.nextUrl.origin;
    const externalSeatIds = selectedSeatIds?.length && !seatHoldToken ? selectedSeatIds : [];
    const seatsIoEventKey = externalSeatIds.length
      // The public renderer falls back to the database event id when an
      // explicit Seats.io event key has not been saved yet. Keep checkout on
      // that exact same key so a newly connected chart can be booked too.
      ? (readSeatsIoEventKey(eventSettings) ?? event[0].id)
      : "";
    let seatsIoBooked = false;
    if (externalSeatIds.length) {
      if (!process.env.SEATSIO_SECRET_KEY) {
        return NextResponse.json({ error: "Reserved seating is not configured yet. Please try again later.", code: "SEATSIO_NOT_CONFIGURED" }, { status: 503 });
      }
      try {
        // Seats.io's booking endpoint is atomic and prevents two buyers from
        // claiming the same table/seat. The chart is rendered without a
        // client session so this server-side booking is authoritative.
        await bookSeatsIoObjects(seatsIoEventKey, externalSeatIds, orderNumber);
        seatsIoBooked = true;
      } catch (error) {
        console.error("[orders] Seats.io booking failed:", error);
        return NextResponse.json({ error: "One or more selected seats are no longer available. Please choose again.", code: "SEATS_UNAVAILABLE" }, { status: 409 });
      }
    }
    const ticketTasks: Array<{
      ticketId: string;
      barcode: string;
      ticketTypeName: string;
    }> = [];
    let orderId = "";

    try {
      await db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({
          companyId: resolvedCompany.id,
          eventId: event[0].id,
          orderNumber,
          status: "completed",
          email: resolvedAttendeeEmail,
          name: resolvedAttendeeName,
          subtotal: subtotal,
          total: subtotal,
          currency: normalizedCartItems[0]?.currency ?? "BHD",
          completedAt: new Date(),
        })
        .returning();
      orderId = order.id;

      await tx.insert(orderItems).values(
        normalizedCartItems.map((item) => ({
          orderId: order.id,
          ticketTypeId: item.ticketTypeId,
          quantity: item.quantity,
          unitPrice: item.price * discountFactor,
          total: item.price * discountFactor * item.quantity,
        })),
      );

      for (const item of normalizedCartItems) {
        // Seats.io owns reserved-seat inventory; do not consume the fallback ticket type quantity.
        if (!isReservedSeating) {
        const updatedTicketType = await tx
          .update(ticketTypes)
          .set({
            // Older ticket rows may have a null quantity_sold despite the
            // column default. Treat those as zero for free reservations too.
            quantitySold: sql`coalesce(${ticketTypes.quantitySold}, 0) + ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(ticketTypes.id, item.ticketTypeId),
              eq(ticketTypes.status, "active"),
              sql`(${ticketTypes.quantityTotal} IS NULL OR coalesce(${ticketTypes.quantitySold}, 0) + ${item.quantity} <= ${ticketTypes.quantityTotal})`,
            ),
          )
          .returning({ id: ticketTypes.id });

        if (!updatedTicketType[0]) {
          throw new CheckoutValidationError(
            `${item.name} is no longer available.`,
          );
        }
        }


        const ticketType = validTicketTypes.find(
          (record) => record.id === item.ticketTypeId,
        );
        const [firstName, ...lastNameParts] = resolvedAttendeeName
          .trim()
          .split(/\s+/)
          .filter(Boolean);

        for (let i = 0; i < item.quantity; i++) {
          const barcode = `TKT-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
          const [newGuest] = await tx
            .insert(guests)
            .values({
              companyId: resolvedCompany.id,
              eventId: event[0].id,
              firstName: firstName || "Guest",
              lastName: lastNameParts.join(" "),
              email: resolvedAttendeeEmail,
              status: "confirmed",
              guestType: ticketType?.name ?? item.name,
              source: "registration",
            })
            .returning();

          const [newTicket] = await tx
            .insert(tickets)
            .values({
              companyId: resolvedCompany.id,
              eventId: event[0].id,
              ticketTypeId: item.ticketTypeId,
              orderId: order.id,
              guestId: newGuest.id,
              barcode,
              attendeeName: resolvedAttendeeName,
              attendeeEmail: resolvedAttendeeEmail,
              ...(selectedSeatIds?.length
                ? {
                    metadata: {
                      seatingProvider: seatHoldToken ? "iticket" : "seats.io",
                      selectedSeatId: selectedSeatIds[ticketTasks.length] ?? null,
                    },
                  }
                : {}),
              status: "valid",
            })
            .returning();

          ticketTasks.push({
            ticketId: newTicket.id,
            barcode,
            ticketTypeName: ticketType?.name ?? item.name,
          });
        }
      }
      if (seatHoldToken) {
        await tx.execute(
          sql`SELECT finalize_seat_hold(${seatHoldToken}::uuid, ${order.id}::uuid, ${ticketTasks.map((task) => task.ticketId)}::uuid[])`,
        );
      }
      });
    } catch (error) {
      if (seatsIoBooked) await releaseSeatsIoObjects(seatsIoEventKey, externalSeatIds);
      throw error;
    }

    for (const task of ticketTasks) {
      generateAndSendTicket({
        ticketId: task.ticketId,
        toEmail: resolvedAttendeeEmail,
        attendeeName: resolvedAttendeeName,
        ticketTypeName: task.ticketTypeName,
        orderNumber,
        barcode: task.barcode,
        eventName: event[0].title,
        eventStartsAt: event[0].startsAt,
        appBaseUrl: origin,
        eventSettings: event[0].settings,
      }).catch((error) => console.error("[orders] ticket send failed:", error));
    }

    return NextResponse.json({
      success: true,
      orderNumber,
      orderId,
    });
  } catch (error) {
    if (error instanceof CheckoutValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Order creation error:", error);
    return NextResponse.json(
      {
        error: "Failed to create order",
        // Keep the client message safe while preserving a support reference in server logs.
        code: "ORDER_CREATION_FAILED",
      },
      { status: 500 },
    );
  }
}
