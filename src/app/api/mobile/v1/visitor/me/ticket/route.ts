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
  rsvp_status: string | null;
  rsvp_at: string | null;
  created_at: string;
};

type TicketRow = {
  id: string;
  guest_id: string | null;
  event_id: string;
  ticket_type_id: string | null;
  barcode: string;
  status: string | null;
  created_at: string;
};

type EventRow = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  venue_id: string | null;
  settings: Record<string, unknown> | null;
  visitor_code: string | null;
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

    const { data: guestRowsData, error: guestError } = await supabase
      .from("guests")
      .select("id,event_id,rsvp_status,rsvp_at,created_at")
      .eq("email", email)
      .order("created_at", { ascending: false });

    if (guestError) {
      return jsonError(guestError.message, 500, "fetch_failed");
    }

    const guestRows = (guestRowsData ?? []) as GuestRow[];
    if (guestRows.length === 0) {
      return NextResponse.json({ ticket: null });
    }

    const guestIds = guestRows.map((guest) => guest.id);
    const { data: ticketRowsData, error: ticketError } = await supabase
      .from("tickets")
      .select("id,guest_id,event_id,ticket_type_id,barcode,status,created_at")
      .in("guest_id", guestIds)
      .order("created_at", { ascending: false });

    if (ticketError) {
      return jsonError(ticketError.message, 500, "fetch_failed");
    }

    const ticket = ((ticketRowsData ?? []) as TicketRow[])[0];
    if (!ticket) {
      return NextResponse.json({ ticket: null });
    }

    const guest = guestRows.find((row) => row.id === ticket.guest_id) ?? guestRows[0];

    const [{ data: eventData, error: eventError }, { data: ticketTypeData, error: ticketTypeError }] = await Promise.all([
      supabase
        .from("events")
        .select("id,title,starts_at,ends_at,venue_id,settings,visitor_code")
        .eq("id", ticket.event_id)
        .maybeSingle(),
      ticket.ticket_type_id
        ? supabase.from("ticket_types").select("name").eq("id", ticket.ticket_type_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (eventError) {
      return jsonError(eventError.message, 500, "fetch_failed");
    }

    if (ticketTypeError) {
      return jsonError(ticketTypeError.message, 500, "fetch_failed");
    }

    const event = eventData as EventRow | null;
    if (!event) {
      return NextResponse.json({ ticket: null });
    }

    let venueName: string | null = null;
    if (event.venue_id) {
      const { data: venueData, error: venueError } = await supabase
        .from("venues")
        .select("name")
        .eq("id", event.venue_id)
        .maybeSingle();

      if (venueError) {
        return jsonError(venueError.message, 500, "fetch_failed");
      }

      venueName = venueData?.name ?? null;
    }

    const settings = (event.settings ?? {}) as Record<string, any>;
    const agendaSettings = (settings.agenda ?? {}) as Record<string, any>;
    const ticketDesign = (settings.ticketDesign ?? {}) as Record<string, any>;

    return NextResponse.json({
      ticket: {
        guestId: guest.id,
        ticketId: ticket.id,
        barcode: ticket.barcode,
        status: ticket.status ?? "valid",
        ticketType: ticketTypeData?.name ?? "General",
        rsvpStatus: guest.rsvp_status,
        rsvpAt: guest.rsvp_at,
        event: {
          id: event.id,
          name: event.title,
          startsAt: event.starts_at,
          endsAt: event.ends_at,
          location: venueName,
          visitorCode: ticketDesign.showVisitorCode !== false ? event.visitor_code : null,
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
