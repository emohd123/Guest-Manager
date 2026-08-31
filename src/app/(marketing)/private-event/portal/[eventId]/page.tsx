import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { getEventExperience } from "@/server/services/event-app";
import {
  privateEventAccessCookie,
  readPrivateEventAccess,
} from "@/server/services/private-event-access";
import { ConferencePortalClient } from "@/components/private-event/conference-portal-client";
import type { LineupArtist } from "@/types/event";

export const dynamic = "force-dynamic";

export default async function PrivateConferencePortal({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const cookieStore = await cookies();
  const access = readPrivateEventAccess(
    cookieStore.get(privateEventAccessCookie.name)?.value,
  );

  if (!access || access.eventId !== eventId || access.role === "speaker")
    redirect(`/private-event/access/${eventId}`);

  const experience = await getEventExperience(eventId);
  const admin = createSupabaseAdminClient();
  const venueId = experience.event.venue_id;
  let venue: { name: string; address: string } | null = null;

  if (venueId) {
    const { data } = await admin
      .from("venues")
      .select("name,address")
      .eq("id", venueId)
      .maybeSingle();
    if (data) {
      const address =
        data.address && typeof data.address === "object"
          ? Object.values(data.address as Record<string, unknown>)
              .filter((value) => typeof value === "string")
              .join(", ")
          : "";
      venue = { name: data.name as string, address };
    }
  }

  const settings = experience.event.settings as Record<string, unknown> | null;
  const agenda = (settings?.agenda ?? {}) as {
    pdfUrl?: string;
    attachmentUrl?: string;
  };
  const publicPage = (settings?.publicPage ?? {}) as {
    venueName?: string;
    locationText?: string;
    galleryImages?: string[];
    lineup?: LineupArtist[];
  };
  const venueName =
    venue?.name ?? publicPage.venueName ?? "Venue to be confirmed";
  const location = venue?.address || publicPage.locationText || venueName;
  const { data: ticket } = await admin
    .from("tickets")
    .select("barcode")
    .eq("event_id", eventId)
    .eq("guest_id", access.guestId)
    .eq("status", "valid")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <ConferencePortalClient
      attendeeName={access.username}
      guestId={access.guestId}
      ticketBarcode={ticket?.barcode ?? null}
      event={{
        id: experience.event.id,
        title: experience.event.title,
        description:
          experience.event.description ??
          experience.event.short_description ??
          "",
        coverImageUrl: experience.event.cover_image_url ?? "",
        startsAt: experience.event.starts_at,
        endsAt: experience.event.ends_at,
        venueName,
        location,
        agendaUrl: agenda.pdfUrl ?? agenda.attachmentUrl ?? "",
        announcements: experience.settings.announcements,
        venueMapUrl: experience.settings.venueMapUrl ?? "",
        resources: experience.settings.resources ?? [],
        speakers: Array.isArray(publicPage.lineup) ? publicPage.lineup : [],
      }}
      sessions={experience.sessions}
    />
  );
}
