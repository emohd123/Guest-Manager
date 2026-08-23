export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { eventCategories, getLocalizedText, normalizeLocale } from "@/lib/marketplace";
import type { MarketplaceDiscoveryResponse, MarketplaceEvent } from "@/types/marketplace";

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
  settings: unknown;
};

type CompanyRow = { id: string; name: string; slug: string };
type CategoryRow = { id: string; name: string; slug: string | null };
type VenueRow = { id: string; name: string; address: unknown };
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

function settingObject(settings: unknown) {
  return settings && typeof settings === "object" ? (settings as Record<string, unknown>) : {};
}

function isPublic(settings: unknown) {
  const publicPage = settingObject(settings).publicPage as { enabled?: boolean; showInMarketplace?: boolean } | undefined;
  return publicPage?.enabled !== false && publicPage?.showInMarketplace !== false;
}

function pickLocation(venue?: VenueRow, publicPage?: Record<string, unknown>) {
  const venueName = typeof publicPage?.venueName === "string" ? publicPage.venueName : venue?.name ?? null;
  const locationText = typeof publicPage?.locationText === "string" ? publicPage.locationText : null;
  return { venueName, locationText };
}

function isSameDay(value: Date, target: Date) {
  return (
    value.getFullYear() === target.getFullYear() &&
    value.getMonth() === target.getMonth() &&
    value.getDate() === target.getDate()
  );
}

function isInCurrentMonth(value: Date, target: Date) {
  return value.getFullYear() === target.getFullYear() && value.getMonth() === target.getMonth();
}

function isInUpcomingWeekend(value: Date, now: Date) {
  const day = now.getDay();
  const daysUntilFriday = (5 - day + 7) % 7;
  const friday = new Date(now);
  friday.setHours(0, 0, 0, 0);
  friday.setDate(now.getDate() + daysUntilFriday);

  const saturday = new Date(friday);
  saturday.setDate(friday.getDate() + 1);
  saturday.setHours(23, 59, 59, 999);

  return value >= friday && value <= saturday;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const { searchParams } = request.nextUrl;
    const locale = normalizeLocale(searchParams.get("locale"));
    const queryText = searchParams.get("q")?.trim().toLowerCase() ?? "";
    const categoryFilter = searchParams.get("category")?.trim().toLowerCase() ?? "";
    const dateFilter = searchParams.get("date")?.trim().toLowerCase() ?? "";
    const limit = Math.min(Number(searchParams.get("limit") ?? 48), 96);
    const now = new Date().toISOString();

    const { data: eventsData, error: eventsError } = await supabase
      .from("events")
      .select("id,company_id,category_id,venue_id,title,slug,short_description,description,cover_image_url,starts_at,ends_at,timezone,registration_enabled,settings")
      .eq("status", "published")
      .is("deleted_at", null)
      .or(`ends_at.gte.${now},and(ends_at.is.null,starts_at.gte.${now})`)
      .order("starts_at", { ascending: true })
      .limit(limit);

    if (eventsError) {
      return NextResponse.json({ error: eventsError.message }, { status: 500 });
    }

    const eventRows = ((eventsData ?? []) as EventRow[]).filter((event) => isPublic(event.settings));
    if (eventRows.length === 0) {
      return NextResponse.json({
        events: [],
        total: 0,
        categories: eventCategories.map((category) => ({ ...category, count: 0 })),
      } satisfies MarketplaceDiscoveryResponse);
    }

    const eventIds = eventRows.map((event) => event.id);
    const companyIds = [...new Set(eventRows.map((event) => event.company_id))];
    const categoryIds = [...new Set(eventRows.map((event) => event.category_id).filter(Boolean))] as string[];
    const venueIds = [...new Set(eventRows.map((event) => event.venue_id).filter(Boolean))] as string[];

    const [
      { data: companiesData, error: companiesError },
      { data: categoriesData, error: categoriesError },
      { data: venuesData, error: venuesError },
      { data: ticketTypesData, error: ticketsError },
    ] = await Promise.all([
      supabase.from("companies").select("id,name,slug").in("id", companyIds),
      categoryIds.length
        ? supabase.from("categories").select("id,name,slug").in("id", categoryIds)
        : Promise.resolve({ data: [], error: null }),
      venueIds.length
        ? supabase.from("venues").select("id,name,address").in("id", venueIds)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("ticket_types")
        .select("id,event_id,name,description,price,currency,quantity_total,quantity_sold,min_per_order,max_per_order,status")
        .in("event_id", eventIds)
        .eq("status", "active"),
    ]);

    const error = companiesError ?? categoriesError ?? venuesError ?? ticketsError;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
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

    let events = eventRows
      .map((event): MarketplaceEvent | null => {
        const company = companyMap.get(event.company_id);
        if (!company?.slug) return null;

        const settings = settingObject(event.settings);
        const publicPage = settingObject(settings.publicPage);
        const organizer = settingObject(settings.organizer);
        const localized = settingObject(settings.localized);
        const category = event.category_id ? categoryMap.get(event.category_id) : undefined;
        const categorySlug =
          (typeof publicPage.categorySlug === "string" ? publicPage.categorySlug : null) ??
          category?.slug ??
          null;
        const tickets = ticketsByEvent.get(event.id) ?? [];
        const prices = tickets.map((ticket) => ticket.price ?? 0);
        const minPrice = prices.length > 0 ? Math.min(...prices) : null;
        const currency = tickets.find((ticket) => ticket.currency)?.currency ?? "BHD";
        const availableTickets = tickets.filter((ticket) => {
          if (!ticket.quantity_total) return true;
          return (ticket.quantity_sold ?? 0) < ticket.quantity_total;
        });
        const publicUrl = `/e/${company.slug}/${event.slug}`;
        const location = pickLocation(event.venue_id ? venueMap.get(event.venue_id) : undefined, publicPage);
        const organizerName =
          typeof organizer.name === "string" && organizer.name.trim()
            ? organizer.name
            : company.name;

        return {
          id: event.id,
          title: event.title,
          titleAr: getLocalizedText(localized.title, "ar", "") || null,
          shortDescription: event.short_description ?? event.description,
          shortDescriptionAr: getLocalizedText(localized.shortDescription, "ar", "") || null,
          coverImageUrl: event.cover_image_url,
          startsAt: event.starts_at,
          endsAt: event.ends_at,
          timezone: event.timezone,
          companyName: company.name,
          organizerName,
          organizerSlug: typeof organizer.slug === "string" ? organizer.slug : null,
          category: category?.name ?? (typeof publicPage.category === "string" ? publicPage.category : null),
          categorySlug,
          venueName: location.venueName,
          locationText: location.locationText,
          publicUrl,
          buyUrl: availableTickets.length > 0 ? `${publicUrl}#tickets` : publicUrl,
          registrationEnabled: event.registration_enabled ?? false,
          hasTickets: availableTickets.length > 0,
          availableTicketCount: availableTickets.length,
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
            available: !ticket.quantity_total || (ticket.quantity_sold ?? 0) < ticket.quantity_total,
          })),
        };
      })
      .filter((event): event is MarketplaceEvent => event !== null);

    if (dateFilter) {
      const today = new Date();
      events = events.filter((event) => {
        const startsAt = new Date(event.startsAt);
        if (Number.isNaN(startsAt.getTime())) return false;
        if (dateFilter === "today") return isSameDay(startsAt, today);
        if (dateFilter === "tomorrow") {
          const tomorrow = new Date(today);
          tomorrow.setDate(today.getDate() + 1);
          return isSameDay(startsAt, tomorrow);
        }
        if (dateFilter === "weekend") return isInUpcomingWeekend(startsAt, today);
        if (dateFilter === "month") return isInCurrentMonth(startsAt, today);
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateFilter)) {
          return isSameDay(startsAt, new Date(`${dateFilter}T00:00:00`));
        }
        return true;
      });
    }

    if (queryText) {
      events = events.filter((event) =>
        [
          event.title,
          event.titleAr,
          event.shortDescription,
          event.shortDescriptionAr,
          event.organizerName,
          event.category,
          event.venueName,
          event.locationText,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(queryText)
      );
    }

    if (categoryFilter) {
      events = events.filter((event) => event.categorySlug?.toLowerCase() === categoryFilter);
    }

    const counts = new Map<string, number>();
    for (const event of events) {
      if (event.categorySlug) counts.set(event.categorySlug, (counts.get(event.categorySlug) ?? 0) + 1);
    }

    const categories = eventCategories.map((category) => ({
      slug: category.slug,
      label: category.label,
      labelAr: category.labelAr,
      kind: category.kind,
      count: counts.get(category.slug) ?? 0,
    }));

    return NextResponse.json({
      events,
      categories,
      total: events.length,
      locale,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch events" },
      { status: 500 }
    );
  }
}
