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
      title: "Summer Sessions: Live at the Harbour",
      titleAr: "أمسيات الصيف: موسيقى حية في المرفأ",
      shortDescription: "An outdoor evening of live music, food, and sunset views.",
      shortDescriptionAr: "أمسية في الهواء الطلق تجمع الموسيقى الحية والطعام وإطلالات الغروب.",
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
      // These fallback cards only exist for local development, so link them to
      // their matching local preview pages instead of a production-only slug.
      publicUrl: "/preview/summer-sessions",
      buyUrl: "/preview/summer-sessions#tickets",
      registrationEnabled: true,
      hasTickets: true,
      availableTicketCount: 180,
      minPrice: 12,
      currency: "EGP",
      ticketTypes: [],
    },
    {
      id: "local-preview-family-carnival",
      title: "Family Carnival Weekend",
      titleAr: "كرنفال العائلة في عطلة نهاية الأسبوع",
      shortDescription: "Games, creative workshops, and entertainment for all ages.",
      shortDescriptionAr: "ألعاب وورش إبداعية وترفيه لجميع أفراد العائلة.",
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
      locationText: "Sakhir, Bahrain",
      publicUrl: "/preview/family-carnival",
      buyUrl: "/preview/family-carnival#tickets",
      registrationEnabled: true,
      hasTickets: true,
      availableTicketCount: 240,
      minPrice: 5,
      currency: "BHD",
      ticketTypes: [],
    },
    {
      id: "local-preview-comedy-night",
      title: "Friday Comedy Night",
      titleAr: "ليلة كوميديا الجمعة",
      shortDescription: "A lively late-night stand-up show with local talent.",
      shortDescriptionAr: "عرض كوميدي مسائي حيوي بمشاركة مواهب محلية.",
      coverImageUrl: "https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=1800&q=85",
      startsAt: new Date(makeDate(7, 20)).toISOString(),
      endsAt: new Date(makeDate(7, 22)).toISOString(),
      timezone: "Asia/Bahrain",
      companyName: "iTicket Preview",
      organizerName: "iTicket Preview",
      organizerSlug: "iticket-preview",
      category: "Comedy",
      categorySlug: "comedy",
      venueName: "Theatre Hall",
      locationText: "Manama, Bahrain",
      publicUrl: "/preview/comedy-night",
      buyUrl: "/preview/comedy-night#tickets",
      registrationEnabled: true,
      hasTickets: true,
      availableTicketCount: 95,
      minPrice: 8,
      currency: "BHD",
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
