"use client";

import { use, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { format } from "date-fns";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Smartphone,
  Share2, 
  ShieldCheck, 
  ArrowLeft,
  Info,
  ChevronRight,
  Ticket,
  Star,
  Heart,
  CreditCard,
  Headphones,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TicketWidget } from "@/components/public/TicketWidget";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { DesignSettings } from "@/types/event";
import { toast } from "sonner";
import { formatMoney, getLocalizedText, marketplaceLocales, normalizeLocale } from "@/lib/marketplace";

const labels = {
  en: {
    eventNotFound: "Event not found",
    eventNotFoundBody: "This event may have been moved, deleted, or is not yet published.",
    returnHome: "Return Home",
    notPublic: "This event page is not public yet",
    notPublicBody: "The iTicket team has not published this event page yet.",
    exploreEvents: "Explore Events",
    date: "Date",
    time: "Time",
    access: "Access",
    from: "From",
    freeEvent: "Free Event",
    paid: "Paid",
    free: "Free",
    about: "About this event",
    fallbackDescription: "Join us for an unforgettable experience. More event details will be added by the iTicket team soon.",
    location: "Location",
    locationFallback: "Virtual Event or Venue TBD",
    showMap: "Show on map",
    mapUnavailable: "Map unavailable",
    spread: "Spread the word",
    sharePaid: "Share the event page with guests ready to purchase access.",
    shareFree: "Invite friends and colleagues to reserve a free spot.",
    copyLink: "Copy link",
    appTitle: "Get the attendee app",
    appBody: "Access live streams, agenda saves, networking, and event updates from your phone.",
    openApp: "Open App Details",
    ticketsAvailable: "Tickets Available",
    freeRegistration: "Free Registration",
    registration: "Registration",
    reservePlace: "Reserve your place",
    paidIntro: "Select your tickets and proceed to complete your registration below.",
    freeIntro: "Choose your free ticket and submit your details to reserve your place.",
    fullName: "Full name",
    email: "Email address",
    checkout: "Proceed to Checkout",
    reserve: "Reserve Free Spot",
    total: "Total Amount",
    selected: "Selected Tickets",
    secure: "Secure Payments",
    delivery: "Digital Delivery",
    terms: "Registration is subject to terms of service. Digital tickets will be sent immediately upon successful payment confirmation.",
  },
  ar: {
    eventNotFound: "لم يتم العثور على الفعالية",
    eventNotFoundBody: "قد تكون هذه الفعالية غير منشورة أو تم نقلها.",
    returnHome: "العودة للرئيسية",
    notPublic: "صفحة الفعالية غير منشورة بعد",
    notPublicBody: "لم ينشر فريق iTicket هذه الصفحة بعد.",
    exploreEvents: "استكشف الفعاليات",
    date: "التاريخ",
    time: "الوقت",
    access: "الدخول",
    from: "من",
    freeEvent: "فعالية مجانية",
    paid: "مدفوعة",
    free: "مجانية",
    about: "عن الفعالية",
    fallbackDescription: "انضم إلينا لتجربة مميزة. سيتم إضافة المزيد من التفاصيل قريبا من فريق iTicket.",
    location: "الموقع",
    locationFallback: "فعالية افتراضية أو موقع يحدد لاحقا",
    showMap: "عرض على الخريطة",
    mapUnavailable: "الخريطة غير متاحة",
    spread: "شارك الفعالية",
    sharePaid: "شارك صفحة الفعالية مع الضيوف الراغبين في شراء التذاكر.",
    shareFree: "ادع الأصدقاء والزملاء لحجز مقعد مجاني.",
    copyLink: "نسخ الرابط",
    appTitle: "تطبيق الحضور",
    appBody: "تابع البث المباشر والجدول والتواصل وتحديثات الفعالية من هاتفك.",
    openApp: "تفاصيل التطبيق",
    ticketsAvailable: "التذاكر متاحة",
    freeRegistration: "تسجيل مجاني",
    registration: "التسجيل",
    reservePlace: "احجز مكانك",
    paidIntro: "اختر التذاكر وأكمل التسجيل أدناه.",
    freeIntro: "اختر تذكرتك المجانية وأدخل بياناتك لحجز مكانك.",
    fullName: "الاسم الكامل",
    email: "البريد الإلكتروني",
    checkout: "المتابعة للدفع",
    reserve: "حجز مجاني",
    total: "الإجمالي",
    selected: "التذاكر المختارة",
    secure: "دفع آمن",
    delivery: "تذاكر رقمية",
    terms: "يخضع التسجيل للشروط والأحكام. سيتم إرسال التذاكر الرقمية بعد تأكيد الدفع بنجاح.",
  },
} as const;

function localizedValue(value: unknown, locale: "en" | "ar", fallback = "") {
  if (typeof value === "string" && value.trim()) return value;
  return getLocalizedText(value, locale, fallback);
}

function getPublicPageSettings(settings: DesignSettings, hasPaidTickets: boolean, locale: "en" | "ar") {
  const publicPage = settings.publicPage ?? {};
  return {
    enabled: publicPage.enabled !== false,
    isPaidEvent: publicPage.isPaidEvent ?? hasPaidTickets,
    heroLabel: localizedValue(publicPage.heroLabel, locale, locale === "ar" ? "صفحة فعالية" : "Event Page"),
    headline: localizedValue(publicPage.headline, locale),
    subheadline: localizedValue(publicPage.subheadline, locale),
    venueName: localizedValue(publicPage.venueName, locale),
    locationText: localizedValue(publicPage.locationText, locale),
    ctaLabel: localizedValue(publicPage.ctaLabel, locale),
    highlights: publicPage.highlights ?? [],
    showAgenda: publicPage.showAgenda !== false,
    showSponsors: publicPage.showSponsors !== false,
    showAppDownload: publicPage.showAppDownload !== false,
  };
}

export default function PublicEventPage({ 
  params 
}: { 
  params: Promise<{ companySlug: string; eventSlug: string }> 
}) {
  const { companySlug, eventSlug } = use(params);
  const searchParams = useSearchParams();
  const locale = normalizeLocale(searchParams.get("locale"));
  const t = labels[locale];
  const dir = marketplaceLocales[locale].dir;
  const [attendeeName, setAttendeeName] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const { data: event, isLoading: eventLoading } = trpc.events.getBySlug.useQuery({ 
    companySlug, 
    eventSlug 
  });

  const { data: ticketTypes, isLoading: ticketsLoading } = trpc.ticketTypes.listPublic.useQuery(
    { eventId: event?.id as string },
    { enabled: !!event?.id }
  );
  const { data: experience } = trpc.eventExperience.publicSummary.useQuery(
    { eventId: event?.id as string },
    { enabled: !!event?.id }
  );

  if (eventLoading) {
    return <LandingPageSkeleton />;
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center space-y-6">
        <div className="h-20 w-20 rounded-3xl bg-zinc-100 flex items-center justify-center text-zinc-400">
          <Info className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight">{t.eventNotFound}</h1>
          <p className="text-muted-foreground max-sm mx-auto">{t.eventNotFoundBody}</p>
        </div>
        <Button asChild className="rounded-2xl h-12 px-8 font-bold">
          <Link href="/">{t.returnHome}</Link>
        </Button>
      </div>
    );
  }

  const settings = (event.settings as DesignSettings) || {};
  const hasPaidTickets = (ticketTypes ?? []).some((ticket) => (ticket.price ?? 0) > 0);
  const publicPage = getPublicPageSettings(settings, hasPaidTickets, locale);
  const eventTitle = publicPage.headline || event.title;
  const eventDescription = localizedValue((settings.publicPage as any)?.description, locale, event.description || t.fallbackDescription);
  const primaryColor = settings.primaryColor || "#2563EB";
  const backgroundColor = settings.backgroundColor || "#FFFFFF";
  const logoUrl = settings.logoUrl || "";
  const mapQuery = [publicPage.venueName, publicPage.locationText].filter(Boolean).join(" ").trim();
  const mapHref = mapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`
    : null;

  if (!publicPage.enabled) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-8">
        <div className="max-w-xl space-y-4 text-center">
          <h1 className="text-3xl font-black tracking-tight">{t.notPublic}</h1>
          <p className="text-muted-foreground">
            {t.notPublicBody}
          </p>
          <Button asChild className="rounded-2xl h-12 px-8 font-bold">
            <Link href="/">{t.returnHome}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleCheckout = async (selection: Record<string, number>) => {
    if (!attendeeName.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!attendeeEmail.trim()) {
      toast.error("Please enter your email address.");
      return;
    }

    const cartItems = Object.entries(selection)
      .filter(([, quantity]) => quantity > 0)
      .map(([ticketTypeId, quantity]) => {
        const ticketType = (ticketTypes ?? []).find((t) => t.id === ticketTypeId);
        if (!ticketType) return null;
        return {
          ticketTypeId,
          name: ticketType.name,
          price: ticketType.price ?? 0,
          currency: ticketType.currency ?? "BHD",
          quantity,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    if (cartItems.length === 0) {
      toast.error("Please select at least one ticket.");
      return;
    }

    try {
      setCheckoutLoading(true);
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companySlug,
          eventSlug,
          attendeeName: attendeeName.trim(),
          attendeeEmail: attendeeEmail.trim(),
          cartItems,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Checkout failed");
      }

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }

      if (result.success) {
        toast.success("Registration complete. Your tickets are being sent by email.");
        return;
      }

      throw new Error("Unexpected checkout response");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Checkout failed";
      toast.error(message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Event link copied.");
    } catch {
      toast.error("Could not copy the event link.");
    }
  };

  const tickets = ticketTypes ?? [];
  const pricedTickets = tickets.filter((ticket) => (ticket.price ?? 0) > 0);
  const lowestPrice = pricedTickets
    .map((ticket) => ticket.price ?? 0)
    .sort((a, b) => a - b)[0] ?? 0;
  const currency = tickets[0]?.currency ?? "BHD";
  const priceFrom = publicPage.isPaidEvent ? formatMoney(lowestPrice, currency, locale) : t.freeEvent;
  const eventDate = format(new Date(event.startsAt), "MMMM d, yyyy");
  const eventTime = format(new Date(event.startsAt), "h:mm a");
  const venueLabel = publicPage.venueName || publicPage.locationText || t.locationFallback;
  const publicMedia = (settings.publicPage as { galleryImages?: unknown; videoUrl?: unknown } | undefined);
  const extraGalleryImages = Array.isArray(publicMedia?.galleryImages)
    ? publicMedia.galleryImages.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  const galleryImages = [...new Set([event.coverImageUrl, ...extraGalleryImages].filter((item): item is string => Boolean(item)))];
  const videoUrl = typeof publicMedia?.videoUrl === "string" && publicMedia.videoUrl.trim()
    ? publicMedia.videoUrl
    : null;
  const importantItems = publicPage.highlights.length
    ? publicPage.highlights.slice(0, 5)
    : [
        "Digital tickets are issued immediately after successful confirmation.",
        "Please bring a valid QR ticket and matching registration email.",
        "Entry timing and venue rules may be updated by the iTicket team.",
      ];
  const supportItems = [
    { icon: ShieldCheck, title: "Secure Checkout", body: "Protected payment and verified order flow." },
    { icon: CheckCircle2, title: "Instant confirmation", body: "Tickets are delivered to your email." },
    { icon: Ticket, title: "Official ticketing", body: "Managed directly by iTicket." },
    { icon: Headphones, title: "Customer support", body: "Help before and after your booking." },
  ];

  return (
    <div className="public-event-scope min-h-screen bg-[#080808] text-white" dir={dir}>
      {settings.customCss && <style>{settings.customCss}</style>}

      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950 text-white">
              <Ticket className="h-5 w-5" />
            </span>
            <span className="text-xl font-black tracking-tight">iTicket</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-bold text-zinc-600 md:flex">
            <Link href="/events" className="hover:text-zinc-950">Events</Link>
            <Link href="/account" className="hover:text-zinc-950">My Tickets</Link>
            <Link href="/#contact" className="hover:text-zinc-950">Support</Link>
          </nav>
          <Button asChild className="h-11 rounded-xl bg-zinc-950 px-5 text-sm font-black text-white hover:bg-zinc-800">
            <a href="#tickets">Select tickets</a>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col gap-4 text-sm md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-500">
            <Link href="/" className="hover:text-zinc-950">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/events" className="hover:text-zinc-950">Events</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="max-w-[280px] truncate text-zinc-900">{event.title}</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleCopyLink} className="h-9 rounded-full gap-2 text-zinc-700">
              <Share2 className="h-4 w-4" />
              Share event
            </Button>
            <Button variant="ghost" size="sm" className="h-9 rounded-full gap-2 text-zinc-700">
              <Heart className="h-4 w-4" />
              Add to favourites
            </Button>
          </div>
        </div>

        <section className="relative overflow-hidden rounded-[28px] bg-zinc-200 shadow-sm">
          <div className="aspect-[16/6.2] min-h-[260px] w-full">
            {event.coverImageUrl ? (
              <img src={event.coverImageUrl} alt={event.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,#d946ef,transparent_32%),linear-gradient(135deg,#111827,#312e81_55%,#0f172a)]">
                <div className="rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-center text-white backdrop-blur">
                  <Ticket className="mx-auto mb-3 h-9 w-9" />
                  <p className="text-sm font-black uppercase tracking-[0.28em]">iTicket Bahrain</p>
                </div>
              </div>
            )}
          </div>
          <button aria-label="Previous image" className="absolute left-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-zinc-800 shadow-md md:flex">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button aria-label="Next image" className="absolute right-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-zinc-800 shadow-md md:flex">
            <ChevronRight className="h-4 w-4" />
          </button>
        </section>

        <div className="mt-8 grid gap-9 lg:grid-cols-[minmax(0,1fr)_360px]">
          <article className="space-y-9">
            <section className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-md bg-[#21c55d] px-2 py-1 text-xs font-black text-white">4.8</span>
                <span className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-current" />
                  ))}
                </span>
                <span className="text-sm font-semibold text-zinc-500">Verified iTicket experience</span>
              </div>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-zinc-950 md:text-5xl">
                {eventTitle}
              </h1>
              <div className="flex flex-wrap items-center gap-5 text-sm font-semibold text-zinc-600">
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-violet-600" />
                  {venueLabel}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-violet-600" />
                  {eventDate}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock className="h-4 w-4 text-violet-600" />
                  {eventTime}
                </span>
              </div>
              {publicPage.subheadline ? (
                <p className="max-w-3xl text-lg leading-8 text-zinc-600">{publicPage.subheadline}</p>
              ) : null}
              <p className="max-w-3xl text-[15px] leading-7 text-zinc-700">{eventDescription}</p>
            </section>

            <section className="border-t border-zinc-200 pt-7">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-black tracking-tight">Important Information</h2>
                <Info className="h-5 w-5 text-zinc-400" />
              </div>
              <ul className="space-y-2 text-sm leading-6 text-zinc-700">
                {importantItems.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {galleryImages.length ? (
              <section className="border-t border-zinc-200 pt-7">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-black tracking-tight">Gallery</h2>
                  <span className="text-sm font-bold text-violet-600">Show more</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {galleryImages.map((image) => (
                    <img key={image} src={image} alt={`${event.title} gallery`} className="aspect-[4/3] rounded-xl object-cover" />
                  ))}
                  {Array.from({ length: Math.max(0, 5 - galleryImages.length) }).map((_, index) => (
                    <div key={index} className="flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white text-xs font-bold text-zinc-400">
                      Coming soon
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {videoUrl ? (
              <section className="border-t border-zinc-200 pt-7">
                <h2 className="mb-4 text-2xl font-black tracking-tight">Event video</h2>
                <video controls preload="metadata" className="aspect-video w-full rounded-2xl bg-zinc-950" src={videoUrl}>
                  Your browser does not support event video playback.
                </video>
              </section>
            ) : null}

            <section className="border-t border-zinc-200 pt-7">
              <h2 className="mb-4 text-2xl font-black tracking-tight">{t.location}</h2>
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                <div className="flex items-start gap-4 border-b border-zinc-100 p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-black">{publicPage.venueName || t.location}</p>
                    <p className="mt-1 text-sm text-zinc-600">{publicPage.locationText || venueLabel}</p>
                  </div>
                </div>
                <div className="relative h-56 bg-[linear-gradient(90deg,#e5e7eb_1px,transparent_1px),linear-gradient(#e5e7eb_1px,transparent_1px)] bg-[size:32px_32px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-100/80 via-transparent to-violet-100/90" />
                  <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg">
                      <MapPin className="h-6 w-6" />
                    </span>
                    {mapHref ? (
                      <a href={mapHref} target="_blank" rel="noreferrer" className="rounded-full bg-white px-4 py-2 text-xs font-black text-zinc-950 shadow">
                        {t.showMap}
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

            <section className="border-t border-zinc-200 pt-7">
              <h2 className="mb-4 text-2xl font-black tracking-tight">{event.title} ticket prices</h2>
              <div className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white">
                {tickets.length ? (
                  tickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between gap-4 px-5 py-4 text-sm">
                      <span className="font-bold text-zinc-800">{ticket.name}</span>
                      <span className="font-semibold text-zinc-600">
                        {publicPage.isPaidEvent ? `from ${formatMoney(ticket.price ?? 0, ticket.currency ?? "BHD", locale)}` : t.freeEvent}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-4 text-sm font-semibold text-zinc-500">Ticket prices will appear here soon.</div>
                )}
              </div>
            </section>

            {publicPage.showAgenda && experience?.sessions?.length ? (
              <section className="border-t border-zinc-200 pt-7">
                <h2 className="mb-4 text-2xl font-black tracking-tight">Agenda</h2>
                <div className="space-y-3">
                  {experience.sessions.slice(0, 6).map((session) => (
                    <div key={session.id} className="rounded-2xl border border-zinc-200 bg-white p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="font-black">{session.title}</h3>
                        <span className="text-xs font-black uppercase tracking-widest text-zinc-500">
                          {session.startsAt ? format(new Date(session.startsAt), "MMM d, h:mm a") : "Time TBD"}
                        </span>
                      </div>
                      {session.description ? <p className="mt-2 text-sm leading-6 text-zinc-600">{session.description}</p> : null}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="border-t border-zinc-200 pt-7">
              <h2 className="mb-4 text-2xl font-black tracking-tight">Rating</h2>
              <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-5">
                <span className="rounded-md bg-[#21c55d] px-3 py-2 text-lg font-black text-white">4.8</span>
                <div>
                  <p className="font-black">Excellent</p>
                  <p className="text-sm text-zinc-500">Reviews and attendee feedback will appear here as orders are completed.</p>
                </div>
              </div>
            </section>
          </article>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <section className="rounded-2xl border border-zinc-300 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-zinc-500">Price from:</p>
              <div className="mt-1 flex items-center justify-between gap-4">
                <p className="text-2xl font-black tracking-tight">{priceFrom}</p>
                <Button asChild className="h-12 rounded-xl bg-zinc-950 px-6 font-black text-white hover:bg-zinc-800">
                  <a href="#tickets">Select tickets</a>
                </Button>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-zinc-500">
                <CheckCircle2 className="h-4 w-4 text-violet-600" />
                Instant confirmation
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-5">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-black">
                <Clock className="h-5 w-5" />
                Timing and Schedule
              </h3>
              <div className="flex justify-between gap-4 text-sm">
                <span className="font-semibold text-zinc-500">Event date</span>
                <span className="text-right font-black text-zinc-900">{eventDate}</span>
              </div>
              <div className="mt-3 flex justify-between gap-4 text-sm">
                <span className="font-semibold text-zinc-500">Start time</span>
                <span className="text-right font-black text-zinc-900">{eventTime}</span>
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-5">
              <h3 className="mb-5 text-lg font-black">Why buy with iTicket?</h3>
              <div className="space-y-5">
                {supportItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex gap-3">
                      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-zinc-500" />
                      <div>
                        <p className="text-sm font-black">{item.title}</p>
                        <p className="text-xs leading-5 text-zinc-500">{item.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 border-t border-zinc-100 pt-4">
                <p className="mb-2 text-xs font-black text-zinc-500">Flexible Payment Options</p>
                <div className="flex flex-wrap items-center gap-2 text-xs font-black">
                  <span className="rounded bg-blue-50 px-2 py-1 text-blue-700">VISA</span>
                  <span className="rounded bg-red-50 px-2 py-1 text-red-700">Mastercard</span>
                  <span className="rounded bg-zinc-100 px-2 py-1 text-zinc-700">Apple Pay</span>
                  <CreditCard className="h-4 w-4 text-zinc-500" />
                </div>
              </div>
            </section>

            <section id="tickets" className="scroll-mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="mb-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">
                  {publicPage.isPaidEvent ? t.ticketsAvailable : t.freeRegistration}
                </p>
                <h3 className="mt-1 text-2xl font-black tracking-tight">
                  {publicPage.isPaidEvent ? t.registration : t.reservePlace}
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  {publicPage.isPaidEvent ? t.paidIntro : t.freeIntro}
                </p>
              </div>

              <div className="mb-5 grid gap-3">
                <Input
                  value={attendeeName}
                  onChange={(e) => setAttendeeName(e.target.value)}
                  placeholder={t.fullName}
                  autoComplete="name"
                  className="h-12 rounded-xl bg-zinc-50"
                />
                <Input
                  type="email"
                  value={attendeeEmail}
                  onChange={(e) => setAttendeeEmail(e.target.value)}
                  placeholder={t.email}
                  autoComplete="email"
                  className="h-12 rounded-xl bg-zinc-50"
                />
              </div>

              {ticketsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full rounded-xl" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                </div>
              ) : (
                <TicketWidget
                  ticketTypes={tickets}
                  onCheckout={handleCheckout}
                  isLoading={checkoutLoading}
                  checkoutLabel={publicPage.ctaLabel || (publicPage.isPaidEvent ? t.checkout : t.reserve)}
                  amountLabel={publicPage.isPaidEvent ? t.total : t.selected}
                  freeEvent={!publicPage.isPaidEvent}
                  locale={locale}
                />
              )}

              <p className="mt-5 border-t border-zinc-100 pt-4 text-xs leading-5 text-zinc-500">{t.terms}</p>
            </section>

            {publicPage.showAppDownload ? (
              <section className="rounded-2xl border border-zinc-200 bg-white p-5">
                <div className="flex gap-3">
                  <Smartphone className="h-5 w-5 text-violet-600" />
                  <div>
                    <h3 className="font-black">{t.appTitle}</h3>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">{t.appBody}</p>
                    <Button asChild variant="outline" className="mt-4 h-10 rounded-xl font-black">
                      <a href="/event-check-in-app">{t.openApp}</a>
                    </Button>
                  </div>
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      </main>
    </div>
  );

}

function LandingPageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-8">
          <Skeleton className="h-6 w-32 rounded-lg" />
          <Skeleton className="h-16 w-3/4 rounded-xl" />
          <div className="flex gap-4">
            <Skeleton className="h-12 w-40 rounded-2xl" />
            <Skeleton className="h-12 w-40 rounded-2xl" />
          </div>
          <Skeleton className="aspect-video w-full rounded-[2.5rem]" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
        <div className="lg:col-span-5">
          <Skeleton className="h-[600px] w-full rounded-[2.5rem]" />
        </div>
      </div>
    </div>
  );
}
