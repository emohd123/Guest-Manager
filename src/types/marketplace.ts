export type MarketplaceTicketType = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  quantityTotal: number | null;
  quantitySold: number | null;
  minPerOrder: number;
  maxPerOrder: number;
  available: boolean;
};

export type MarketplaceEvent = {
  id: string;
  title: string;
  titleAr: string | null;
  shortDescription: string | null;
  shortDescriptionAr: string | null;
  coverImageUrl: string | null;
  startsAt: string;
  endsAt: string | null;
  timezone: string | null;
  companyName: string;
  organizerName: string;
  organizerSlug: string | null;
  category: string | null;
  categorySlug: string | null;
  venueName: string | null;
  locationText: string | null;
  publicUrl: string;
  buyUrl: string;
  registrationEnabled: boolean;
  hasTickets: boolean;
  availableTicketCount: number;
  minPrice: number | null;
  currency: string;
  ticketTypes: MarketplaceTicketType[];
};

export type MarketplaceDiscoveryResponse = {
  events: MarketplaceEvent[];
  categories: Array<{
    slug: string;
    label: string;
    labelAr: string;
    count: number;
    kind: "public" | "service" | "hybrid";
  }>;
  total: number;
};

