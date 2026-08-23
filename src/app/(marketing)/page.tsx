import { getAppUrl } from "@/lib/app-urls";
import { MarketplaceClient } from "@/components/marketplace/marketplace-client";
import { eventCategories } from "@/lib/marketplace";
import type { MarketplaceDiscoveryResponse, MarketplaceEvent } from "@/types/marketplace";
import { headers } from "next/headers";
import { normalizeLocale } from "@/lib/marketplace";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<{
    locale?: string;
    q?: string;
  }>;
};

function localPreviewData(): MarketplaceDiscoveryResponse {
  const now = Date.now();
  const makeDate = (daysFromToday: number, hour: number) =>
    new Date(now + daysFromToday * 86_400_000).setHours(hour, 0, 0, 0);
  const events: MarketplaceEvent[] = [
    {
      id: "local-preview-summer-sessions",
      title: "Summer Sessions: Live at Cairo Festival City",
      titleAr: "أمسيات الصيف: موسيقى حية في القاهرة",
      shortDescription: "An outdoor evening of live music, food, and sunset views in Cairo.",
      shortDescriptionAr: "أمسية في الهواء الطلق تجمع الموسيقى الحية والطعام وإطلالات الغروب في القاهرة.",
      coverImageUrl: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1800&q=85",
      startsAt: new Date(makeDate(2, 19)).toISOString(),
      endsAt: new Date(makeDate(2, 23)).toISOString(),
      timezone: "Africa/Cairo",
      companyName: "iTicket Preview",
      organizerName: "iTicket Preview",
      organizerSlug: "iticket-preview",
      category: "Concerts",
      categorySlug: "concerts",
      venueName: "Cairo Festival City",
      locationText: "Cairo, Egypt",
      publicUrl: "/preview/summer-sessions",
      buyUrl: "/preview/summer-sessions#tickets",
      registrationEnabled: true,
      hasTickets: true,
      availableTicketCount: 180,
      minPrice: 1200,
      currency: "EGP",
      ticketTypes: [],
    },
    {
      id: "local-preview-family-carnival",
      title: "Family Carnival Weekend",
      titleAr: "كرنفال العائلة في عطلة نهاية الأسبوع",
      shortDescription: "Games, creative workshops, and entertainment for all ages in Cairo.",
      shortDescriptionAr: "ألعاب وورش إبداعية وترفيه لجميع أفراد العائلة في القاهرة.",
      coverImageUrl: "https://images.unsplash.com/photo-1560961911-ba7ef651a56c?auto=format&fit=crop&w=1800&q=85",
      startsAt: new Date(makeDate(4, 16)).toISOString(),
      endsAt: new Date(makeDate(4, 21)).toISOString(),
      timezone: "Africa/Cairo",
      companyName: "iTicket Preview",
      organizerName: "iTicket Preview",
      organizerSlug: "iticket-preview",
      category: "Family",
      categorySlug: "family",
      venueName: "Egypt International Exhibition Center",
      locationText: "Cairo, Egypt",
      publicUrl: "/preview/family-carnival",
      buyUrl: "/preview/family-carnival#tickets",
      registrationEnabled: true,
      hasTickets: true,
      availableTicketCount: 240,
      minPrice: 500,
      currency: "EGP",
      ticketTypes: [],
    },
    {
      id: "local-preview-comedy-night",
      title: "Friday Comedy Night Cairo",
      titleAr: "ليلة كوميديا الجمعة في القاهرة",
      shortDescription: "A lively late-night stand-up show with local talent in Cairo.",
      shortDescriptionAr: "عرض كوميدي مسائي حيوي بمشاركة مواهب محلية في القاهرة.",
      coverImageUrl: "https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=1800&q=85",
      startsAt: new Date(makeDate(7, 20)).toISOString(),
      endsAt: new Date(makeDate(7, 22)).toISOString(),
      timezone: "Africa/Cairo",
      companyName: "iTicket Preview",
      organizerName: "iTicket Preview",
      organizerSlug: "iticket-preview",
      category: "Comedy",
      categorySlug: "comedy",
      venueName: "Cairo International Convention Centre",
      locationText: "Cairo, Egypt",
      publicUrl: "/preview/comedy-night",
      buyUrl: "/preview/comedy-night#tickets",
      registrationEnabled: true,
      hasTickets: true,
      availableTicketCount: 95,
      minPrice: 800,
      currency: "EGP",
      ticketTypes: [],
    },
  ];

  return {
    events,
    total: events.length,
    categories: eventCategories.map((category) => ({
      ...category,
      count: events.filter((event) => event.categorySlug === category.slug).length,
    })),
  };
}

async function getMarketplaceData(locale: string): Promise<MarketplaceDiscoveryResponse> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const origin = host ? `${protocol}://${host}` : getAppUrl();
  const isLocalPreview = host?.startsWith("localhost") || host?.startsWith("127.0.0.1");
  const response = await fetch(`${origin}/api/events/discover?limit=24&locale=${locale}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return isLocalPreview ? localPreviewData() : { events: [], categories: [], total: 0 };
  }

  const data = (await response.json()) as MarketplaceDiscoveryResponse;
  return isLocalPreview && data.events.length === 0 ? localPreviewData() : data;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const locale = normalizeLocale(params.locale);
  const data = await getMarketplaceData(locale);
  return <MarketplaceClient initialData={data} initialLocale={locale} initialQuery={params.q ?? ""} mode="home" />;
}
