import { getAppUrl } from "@/lib/app-urls";
import { MarketplaceClient } from "@/components/marketplace/marketplace-client";
import { normalizeLocale } from "@/lib/marketplace";
import type { MarketplaceDiscoveryResponse } from "@/types/marketplace";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

type EventsPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    date?: string;
    locale?: string;
  }>;
};

async function getMarketplaceData(params: URLSearchParams): Promise<MarketplaceDiscoveryResponse> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const origin = host ? `${protocol}://${host}` : getAppUrl();
  const response = await fetch(`${origin}/api/events/discover?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return { events: [], categories: [], total: 0 };
  }

  return (await response.json()) as MarketplaceDiscoveryResponse;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams;
  const locale = normalizeLocale(params.locale);
  const query = params.q ?? "";
  const category = params.category ?? "";
  const date = params.date ?? "";
  const apiParams = new URLSearchParams({ locale, limit: "96" });
  if (query) apiParams.set("q", query);
  if (category) apiParams.set("category", category);
  if (date) apiParams.set("date", date);
  const data = await getMarketplaceData(apiParams);

  return (
    <MarketplaceClient
      initialData={data}
      initialLocale={locale}
      mode="list"
      initialCategory={category}
      initialQuery={query}
      initialDate={date}
    />
  );
}
