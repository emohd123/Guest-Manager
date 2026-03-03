export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "../../../utils";
import { createClient } from "@supabase/supabase-js";
import { getDb } from "@/server/db";
import { guests, tickets, events as eventsTable } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

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

    const db = getDb();
    const email = userData.user.email;

    // Find the visitor's guest record
    const guest = await db.query.guests.findFirst({ where: eq(guests.email, email) });
    if (!guest) return NextResponse.json({ guests: [] });

    // Find the visitor's most recent event
    const latestTicket = await db.query.tickets.findFirst({
      where: eq(tickets.guestId, guest.id),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });

    if (!latestTicket) return NextResponse.json({ guests: [] });

    // Get all guests who have tickets for the same event
    const eventGuests = await db.query.guests.findMany({
      where: eq(guests.eventId, latestTicket.eventId),
      columns: { id: true, firstName: true, lastName: true },
      limit: 100,
    });

    return NextResponse.json({
      guests: eventGuests.map((g) => ({
        id: g.id,
        firstName: g.firstName ?? "Guest",
        lastName: g.lastName ?? null,
      })),
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to fetch guests",
      500,
      "fetch_failed"
    );
  }
}
