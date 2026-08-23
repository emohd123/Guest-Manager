import { MobileSearchPage } from "@/components/marketplace/mobile-search-page";
import { getAppUrl } from "@/lib/app-urls";
import { normalizeLocale } from "@/lib/marketplace";
import type { MarketplaceDiscoveryResponse } from "@/types/marketplace";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<{ locale?: string }>;
};

async function discover(locale: string): Promise<MarketplaceDiscoveryResponse> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const origin = host ? `${protocol}://${host}` : getAppUrl();
  try {
    const response = await fetch(`${origin}/api/events/discover?limit=36&locale=${locale}`, {
      next: { revalidate: 30, tags: ["public-events"] },
    });
    if (!response.ok) return { events: [], categories: [], total: 0 };
    const data = (await response.json()) as MarketplaceDiscoveryResponse;
    return data;
  } catch {
    return { events: [], categories: [], total: 0 };
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const locale = normalizeLocale(params.locale);
  const data = await discover(locale);
  return <MobileSearchPage initialEvents={data.events} locale={locale} />;
}
