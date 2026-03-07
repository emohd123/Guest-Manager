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
  first_name: string | null;
  last_name: string | null;
  rsvp_status: string | null;
  rsvp_at: string | null;
  created_at: string;
};

type EventRow = {
  id: string;
  title: string;
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

    const { data: myGuests, error: myGuestsError } = await supabase
      .from("guests")
      .select("id,event_id,created_at")
      .eq("email", email)
      .order("created_at", { ascending: false });

    if (myGuestsError) {
      return jsonError(myGuestsError.message, 500, "fetch_failed");
    }

    const primaryGuest = myGuests?.[0];
    if (!primaryGuest?.event_id) {
      return NextResponse.json({ guests: [] });
    }

    const [{ data: eventGuestsData, error: eventGuestsError }, { data: eventData, error: eventError }] = await Promise.all([
      supabase
        .from("guests")
        .select("id,event_id,first_name,last_name,rsvp_status,rsvp_at,created_at")
        .eq("event_id", primaryGuest.event_id)
        .order("created_at", { ascending: true })
        .limit(100),
      supabase.from("events").select("id,title").eq("id", primaryGuest.event_id).maybeSingle(),
    ]);

    if (eventGuestsError) {
      return jsonError(eventGuestsError.message, 500, "fetch_failed");
    }

    if (eventError) {
      return jsonError(eventError.message, 500, "fetch_failed");
    }

    const event = (eventData as EventRow | null) ?? null;

    return NextResponse.json({
      guests: ((eventGuestsData ?? []) as GuestRow[]).map((guest) => ({
        id: guest.id,
        firstName: guest.first_name ?? "Guest",
        lastName: guest.last_name ?? null,
        eventId: guest.event_id,
        eventName: event?.title ?? null,
        rsvpStatus: guest.rsvp_status,
        rsvpAt: guest.rsvp_at,
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
