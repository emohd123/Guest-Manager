import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/server/supabase/admin";

export const revalidate = 30;

type ConferenceRow = {
  id: string;
  venue_id: string | null;
  title: string;
  short_description: string | null;
  description: string | null;
  cover_image_url: string | null;
  starts_at: string;
  ends_at: string | null;
  timezone: string | null;
  visitor_code: string | null;
  settings: unknown;
};

type VenueRow = { id: string; name: string | null };

function settingsObject(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function isPrivateAccessEnabled(settings: unknown) {
  const publicPage = settingsObject(settings).publicPage as { enabled?: boolean } | undefined;
  return publicPage?.enabled !== false;
}

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("events")
      .select("id,venue_id,title,short_description,description,cover_image_url,starts_at,ends_at,timezone,visitor_code,settings")
      .eq("event_type", "conference")
      .eq("status", "published")
      .is("deleted_at", null)
      .order("starts_at", { ascending: true });

    if (error) throw new Error(error.message);

    const conferences = ((data ?? []) as ConferenceRow[]).filter((event) => isPrivateAccessEnabled(event.settings));
    const venueIds = [...new Set(conferences.map((event) => event.venue_id).filter(Boolean))] as string[];
    const { data: venuesData, error: venuesError } = venueIds.length
      ? await supabase.from("venues").select("id,name").in("id", venueIds)
      : { data: [], error: null };
    if (venuesError) throw new Error(venuesError.message);

    const venueNames = new Map(((venuesData ?? []) as VenueRow[]).map((venue) => [venue.id, venue.name]));

    return NextResponse.json({
      conferences: conferences.map((event) => {
        const settings = settingsObject(event.settings);
        const publicPage = settingsObject(settings.publicPage);
        return {
          id: event.id,
          title: event.title,
          description: event.short_description ?? event.description ?? "Private conference details are available after access is verified.",
          coverImageUrl: event.cover_image_url,
          startsAt: event.starts_at,
          endsAt: event.ends_at,
          timezone: event.timezone,
          accessConfigured: Boolean(event.visitor_code),
          venueName:
            (typeof publicPage.venueName === "string" && publicPage.venueName) ||
            (event.venue_id ? venueNames.get(event.venue_id) : null) ||
            "Venue to be confirmed",
        };
      }),
    });
  } catch {
    return NextResponse.json({ conferences: [] }, { status: 500 });
  }
}
