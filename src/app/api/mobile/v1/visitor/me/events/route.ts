export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "../../../utils";
import { createClient } from "@supabase/supabase-js";
import { getDb } from "@/server/db";
import { guests, tickets, events as eventsTable } from "@/server/db/schema";
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
    if (userError || !userData.user?.email) {
      return jsonError("Invalid or expired token", 401, "unauthorized");
    }

    const email = userData.user.email;
    const db = getDb();

    // 1. Find guest by email
    const guestRows = await db.select().from(guests).where(eq(guests.email, email)).limit(1);
    if (!guestRows.length) return NextResponse.json({ events: [] });

    const guestId = guestRows[0].id;

    // 2. Get all tickets for this guest
    const guestTickets = await db
      .select({ eventId: tickets.eventId, status: tickets.status, checkedIn: tickets.checkedIn })
      .from(tickets)
      .where(eq(tickets.guestId, guestId))
      .orderBy(tickets.createdAt);

    if (!guestTickets.length) return NextResponse.json({ events: [] });

    // 3. Fetch event details for each unique eventId
    const eventIds = [...new Set(guestTickets.map((t) => t.eventId))];
    const eventRows = await db
      .select({ id: eventsTable.id, name: eventsTable.name, startsAt: eventsTable.startsAt })
      .from(eventsTable)
      .where(eq(eventsTable.id, eventIds[0])); // base query – we'll expand

    // For multiple events, use a map
    const eventMap = new Map<string, { id: string; name: string; startsAt: Date }>();
    for (const evId of eventIds) {
      const rows = await db
        .select({ id: eventsTable.id, name: eventsTable.name, startsAt: eventsTable.startsAt })
        .from(eventsTable)
        .where(eq(eventsTable.id, evId))
        .limit(1);
      if (rows.length) eventMap.set(evId, rows[0]);
    }

    const result = guestTickets
      .map((t) => {
        const ev = eventMap.get(t.eventId);
        if (!ev) return null;
        return {
          eventId: ev.id,
          eventName: ev.name,
          startsAt: ev.startsAt,
          ticketStatus: t.status ?? "valid",
          attendanceState: t.checkedIn ? "checked_in" : null,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ events: result });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to fetch events",
      500,
      "fetch_failed"
    );
  }
}
