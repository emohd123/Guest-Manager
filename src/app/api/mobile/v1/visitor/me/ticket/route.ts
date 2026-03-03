export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "../../../utils";
import { createClient } from "@supabase/supabase-js";
import { getDb } from "@/server/db";
import { guests, tickets, events as eventsTable, ticketTypes, venues } from "@/server/db/schema";
import { eq } from "drizzle-orm";

function getBearerToken(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : null;
}

export async function GET(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    if (!token) return jsonError("Missing bearer token", 401, "unauthorized");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return jsonError("Invalid or expired token", 401, "unauthorized");
    }

    const email = userData.user.email;
    if (!email) return jsonError("No email on account", 400, "no_email");

    const db = getDb();

    // 1. Find guest by email
    const guest = await db.select().from(guests).where(eq(guests.email, email)).limit(1);
    if (!guest.length) return NextResponse.json({ ticket: null });

    // 2. Find the latest ticket for this guest
    const ticketRows = await db
      .select()
      .from(tickets)
      .where(eq(tickets.guestId, guest[0].id))
      .orderBy(tickets.createdAt)
      .limit(1);

    if (!ticketRows.length) return NextResponse.json({ ticket: null });
    const ticket = ticketRows[0];

    // 3. Get event + venue
    const eventRows = await db.select().from(eventsTable).where(eq(eventsTable.id, ticket.eventId)).limit(1);
    if (!eventRows.length) return NextResponse.json({ ticket: null });
    const event = eventRows[0];

    // 4. Get venue name (location)
    let venueLocation: string | null = null;
    if (event.venueId) {
      const venueRows = await db.select({ name: venues.name }).from(venues).where(eq(venues.id, event.venueId)).limit(1);
      venueLocation = venueRows[0]?.name ?? null;
    }

    // 5. Get ticket type name
    const ttRows = await db.select({ name: ticketTypes.name }).from(ticketTypes).where(eq(ticketTypes.id, ticket.ticketTypeId)).limit(1);
    const typeName = ttRows[0]?.name ?? "General";

    // 6. Extract agenda from event settings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const settings = (event.settings ?? {}) as any;
    const agendaSettings = settings.agenda ?? {};
    const ticketDesign = settings.ticketDesign ?? {};

    return NextResponse.json({
      ticket: {
        ticketId: ticket.id,
        barcode: ticket.barcode,
        status: ticket.status ?? "valid",
        ticketType: typeName,
        event: {
          id: event.id,
          name: event.title,
          startsAt: event.startsAt,
          endsAt: event.endsAt ?? null,
          location: venueLocation,
          visitorCode: ticketDesign.showVisitorCode !== false ? (event.visitorCode ?? null) : null,
        },
        agenda: agendaSettings.mode === "design" ? (agendaSettings.items ?? []) : [],
        agendaTitle: agendaSettings.agendaTitle ?? null,
      },
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to fetch ticket",
      500,
      "fetch_failed"
    );
  }
}
