export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "../../../utils";
import { createSupabaseAdminClient } from "@/server/supabase/admin";

function getBearerToken(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : null;
}

type GuestRow = {
  id: string;
  event_id: string;
  status: string;
  rsvp_status: string | null;
  rsvp_at: string | null;
  attendance_state: string | null;
  created_at: string;
};

type TicketRow = {
  id: string;
  guest_id: string | null;
  event_id: string;
  status: string | null;
  checked_in: boolean | null;
  created_at: string;
};

type EventRow = {
  id: string;
  title: string;
  starts_at: string;
};

export async function GET(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    if (!token) return jsonError("Missing bearer token", 401, "unauthorized");

    const supabase = createSupabaseAdminClient();
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user?.email) {
      return jsonError("Invalid or expired token", 401, "unauthorized");
    }

    const email = userData.user.email;
    const { data: guestsData, error: guestsError } = await supabase
      .from("guests")
      .select("id,event_id,status,rsvp_status,rsvp_at,attendance_state,created_at")
      .eq("email", email)
      .order("created_at", { ascending: false });

    if (guestsError) {
      return jsonError(guestsError.message, 500, "fetch_failed");
    }

    const guestRows = (guestsData ?? []) as GuestRow[];
    if (guestRows.length === 0) {
      return NextResponse.json({ events: [] });
    }

    const eventIds = [...new Set(guestRows.map((guest) => guest.event_id))];
    const guestIds = guestRows.map((guest) => guest.id);

    const [{ data: eventsData, error: eventsError }, { data: ticketsData, error: ticketsError }] = await Promise.all([
      supabase.from("events").select("id,title,starts_at").in("id", eventIds),
      supabase
        .from("tickets")
        .select("id,guest_id,event_id,status,checked_in,created_at")
        .in("guest_id", guestIds)
        .order("created_at", { ascending: false }),
    ]);

    if (eventsError) {
      return jsonError(eventsError.message, 500, "fetch_failed");
    }

    if (ticketsError) {
      return jsonError(ticketsError.message, 500, "fetch_failed");
    }

    const eventMap = new Map(((eventsData ?? []) as EventRow[]).map((event) => [event.id, event]));
    const latestTicketByGuest = new Map<string, TicketRow>();

    for (const ticket of (ticketsData ?? []) as TicketRow[]) {
      if (ticket.guest_id && !latestTicketByGuest.has(ticket.guest_id)) {
        latestTicketByGuest.set(ticket.guest_id, ticket);
      }
    }

    const events = guestRows
      .map((guest) => {
        const event = eventMap.get(guest.event_id);
        if (!event) return null;
        const ticket = latestTicketByGuest.get(guest.id);
        const checkedIn = guest.attendance_state === "checked_in" || ticket?.checked_in === true;

        return {
          guestId: guest.id,
          eventId: event.id,
          eventName: event.title,
          startsAt: event.starts_at,
          ticketStatus: ticket?.status ?? guest.status,
          attendanceState: checkedIn ? "checked_in" : guest.attendance_state,
          rsvpStatus: guest.rsvp_status,
          rsvpAt: guest.rsvp_at,
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(a!.startsAt).getTime() - new Date(b!.startsAt).getTime());

    return NextResponse.json({ events });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to fetch events",
      500,
      "fetch_failed"
    );
  }
}
