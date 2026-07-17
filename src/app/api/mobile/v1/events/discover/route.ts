export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { jsonError } from "../../utils";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { getLocalizedText } from "@/lib/marketplace";

type EventRow = {
  id: string;
  company_id: string;
  category_id: string | null;
  venue_id: string | null;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  cover_image_url: string | null;
  starts_at: string;
  ends_at: string | null;
  timezone: string | null;
  registration_enabled: boolean | null;
  max_capacity: number | null;
  settings: unknown;
  metadata: unknown;
};

type CompanyRow = {
  id: string;
  name: string;
  slug: string;
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string | null;
};

type VenueRow = {
  id: string;
  name: string;
};

type TicketTypeRow = {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string | null;
  quantity_total: number | null;
  quantity_sold: number | null;
  min_per_order: number | null;
  max_per_order: number | null;
  status: string | null;
};

function isPublicPageEnabled(settings: unknown) {
  if (!settings || typeof settings !== "object") return true;
  const publicPage = (settings as { publicPage?: { enabled?: boolean } }).publicPage;
  return publicPage?.enabled !== false;
}

function isShownInApp(settings: unknown) {
  if (!settings || typeof settings !== "object") return true;
  const publicPage = (settings as { publicPage?: { showInApp?: boolean } }).publicPage;
  return publicPage?.showInApp !== false;
}

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();
    const now = new Date().toISOString();

    const { data: eventsData, error: eventsError } = await supabase
      .from("events")
      .select(
        "id,company_id,category_id,venue_id,title,slug,short_description,description,cover_image_url,starts_at,ends_at,timezone,registration_enabled,max_capacity,settings,metadata"
      )
      .eq("status", "published")
      .is("deleted_at", null)
      .or(`ends_at.gte.${now},and(ends_at.is.null,starts_at.gte.${now})`)
      .order("starts_at", { ascending: true })
      .limit(12);

    if (eventsError) {
      return jsonError(eventsError.message, 500, "fetch_failed");
    }

    const eventRows = ((eventsData ?? []) as EventRow[]).filter(
      (event) => isPublicPageEnabled(event.settings) && isShownInApp(event.settings)
    );
    if (eventRows.length === 0) return NextResponse.json({ events: [] });

    const eventIds = eventRows.map((event) => event.id);
    const companyIds = [...new Set(eventRows.map((event) => event.company_id))];
    const categoryIds = [...new Set(eventRows.map((event) => event.category_id).filter(Boolean))] as string[];
    const venueIds = [...new Set(eventRows.map((event) => event.venue_id).filter(Boolean))] as string[];

    const [
      { data: companiesData, error: companiesError },
      { data: categoriesData, error: categoriesError },
      { data: venuesData, error: venuesError },
      { data: ticketTypesData, error: ticketsError },
    ] =
      await Promise.all([
        supabase.from("companies").select("id,name,slug").in("id", companyIds),
        categoryIds.length
          ? supabase.from("categories").select("id,name,slug").in("id", categoryIds)
          : Promise.resolve({ data: [], error: null }),
        venueIds.length
          ? supabase.from("venues").select("id,name").in("id", venueIds)
          : Promise.resolve({ data: [], error: null }),
        supabase
          .from("ticket_types")
          .select("id,event_id,name,description,price,currency,quantity_total,quantity_sold,min_per_order,max_per_order,status")
          .in("event_id", eventIds)
          .eq("status", "active"),
      ]);

    if (companiesError) {
      return jsonError(companiesError.message, 500, "fetch_failed");
    }
    if (categoriesError) {
      return jsonError(categoriesError.message, 500, "fetch_failed");
    }
    if (venuesError) {
      return jsonError(venuesError.message, 500, "fetch_failed");
    }
    if (ticketsError) {
      return jsonError(ticketsError.message, 500, "fetch_failed");
    }

    const companyMap = new Map(((companiesData ?? []) as CompanyRow[]).map((company) => [company.id, company]));
    const categoryMap = new Map(((categoriesData ?? []) as CategoryRow[]).map((category) => [category.id, category]));
    const venueMap = new Map(((venuesData ?? []) as VenueRow[]).map((venue) => [venue.id, venue]));
    const ticketsByEvent = new Map<string, TicketTypeRow[]>();

    for (const ticket of (ticketTypesData ?? []) as TicketTypeRow[]) {
      const current = ticketsByEvent.get(ticket.event_id) ?? [];
      current.push(ticket);
      ticketsByEvent.set(ticket.event_id, current);
    }

    const events = eventRows
      .map((event) => {
        const company = companyMap.get(event.company_id);
        if (!company?.slug) return null;

        const settings =
          event.settings && typeof event.settings === "object"
            ? (event.settings as Record<string, any>)
            : {};
        const metadata =
          event.metadata && typeof event.metadata === "object"
            ? (event.metadata as Record<string, any>)
            : {};
        const publicPage = (settings.publicPage ?? {}) as Record<string, any>;
        const organizer = (settings.organizer ?? {}) as Record<string, any>;
        const category = event.category_id ? categoryMap.get(event.category_id) : undefined;
        const venue = event.venue_id ? venueMap.get(event.venue_id) : undefined;
        const tickets = ticketsByEvent.get(event.id) ?? [];
        const prices = tickets.map((ticket) => ticket.price ?? 0);
        const minPrice = prices.length > 0 ? Math.min(...prices) : null;
        const currency = tickets.find((ticket) => ticket.currency)?.currency ?? "BHD";
        const availableTicketCount = tickets.filter((ticket) => {
          if (!ticket.quantity_total) return true;
          return (ticket.quantity_sold ?? 0) < ticket.quantity_total;
        }).length;
        const publicUrl = `/e/${company.slug}/${event.slug}`;

        return {
          id: event.id,
          title: event.title,
          titleAr: getLocalizedText(publicPage.headline, "ar", event.title),
          shortDescription: event.short_description ?? event.description,
          shortDescriptionAr: getLocalizedText(
            publicPage.subheadline ?? publicPage.description,
            "ar",
            event.short_description ?? event.description ?? ""
          ),
          coverImageUrl: event.cover_image_url,
          startsAt: event.starts_at,
          endsAt: event.ends_at,
          timezone: event.timezone,
          companyName: company.name,
          organizerName: organizer.name ?? company.name,
          organizerNameAr: getLocalizedText(organizer.name, "ar", organizer.name ?? company.name),
          category: category?.name ?? publicPage.category ?? null,
          categoryAr: getLocalizedText(publicPage.category, "ar", category?.name ?? publicPage.category ?? ""),
          categorySlug: category?.slug ?? publicPage.categorySlug ?? null,
          venueName: publicPage.venueName ?? venue?.name ?? null,
          venueNameAr: getLocalizedText(publicPage.venueName, "ar", publicPage.venueName ?? venue?.name ?? ""),
          locationText: publicPage.locationText ?? null,
          locationTextAr: getLocalizedText(publicPage.locationText, "ar", publicPage.locationText ?? ""),
          aiTagline: typeof metadata.aiTagline === "string" ? metadata.aiTagline : null,
          publicUrl,
          buyUrl: availableTicketCount > 0 ? `${publicUrl}#tickets` : publicUrl,
          registrationEnabled: event.registration_enabled ?? false,
          hasTickets: availableTicketCount > 0,
          availableTicketCount,
          minPrice,
          currency,
          ticketTypes: tickets.map((ticket) => ({
            id: ticket.id,
            name: ticket.name,
            description: ticket.description,
            price: ticket.price ?? 0,
            currency: ticket.currency ?? currency,
            quantityTotal: ticket.quantity_total,
            quantitySold: ticket.quantity_sold,
            minPerOrder: ticket.min_per_order ?? 1,
            maxPerOrder: ticket.max_per_order ?? 10,
            available:
              !ticket.quantity_total || (ticket.quantity_sold ?? 0) < ticket.quantity_total,
          })),
        };
      })
      .filter(Boolean);

    return NextResponse.json({ events });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to fetch events",
      500,
      "fetch_failed"
    );
  }
}
