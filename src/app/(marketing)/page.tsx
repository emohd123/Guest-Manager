import { getAppUrl } from "@/lib/app-urls";
import { MarketplaceClient } from "@/components/marketplace/marketplace-client";
import type { MarketplaceDiscoveryResponse } from "@/types/marketplace";
import { headers } from "next/headers";
import { normalizeLocale } from "@/lib/marketplace";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<{
    locale?: string;
  }>;
};

async function getMarketplaceData(locale: string): Promise<MarketplaceDiscoveryResponse> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const origin = host ? `${protocol}://${host}` : getAppUrl();
  const response = await fetch(`${origin}/api/events/discover?limit=24&locale=${locale}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return { events: [], categories: [], total: 0 };
  }

  return (await response.json()) as MarketplaceDiscoveryResponse;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const locale = normalizeLocale(params.locale);
  const data = await getMarketplaceData(locale);
  return <MarketplaceClient initialData={data} initialLocale={locale} mode="home" />;
}
