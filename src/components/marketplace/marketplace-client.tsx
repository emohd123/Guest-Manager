"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { BadgeCheck, CalendarDays, ChevronRight, Headphones, Heart, MapPin, Search, ShieldCheck, Sparkles, Ticket, UsersRound, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingLines } from "@/components/visual/floating-lines";
import { eventCategories, formatMoney, normalizeLocale, type LocaleCode } from "@/lib/marketplace";
import type { MarketplaceDiscoveryResponse, MarketplaceEvent } from "@/types/marketplace";
import { cn } from "@/lib/utils";

// Shared filter-chip styles. `chip-flash` triggers a one-shot white blink whenever a
// chip becomes active (keyframes in globals.css); the active chips also render an
// inline check icon via `chip-check` so the selection is unmistakable.
const chipBase =
  "group inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-3 text-sm font-black transition-all duration-200 cursor-pointer select-none active:scale-95 [-webkit-tap-highlight-color:transparent] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60";
const chipActiveWhite = "chip-flash bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.25)]";
const chipActiveCyan = "chip-flash bg-cyan-300 text-black shadow-[0_0_20px_rgba(103,232,249,0.35)]";
const chipInactive =
  "border border-white/10 bg-white/[0.05] text-white/75 hover:border-white/25 hover:text-white";

// Subject-relevant, curated category imagery (stable Unsplash photos).
const CATEGORY_IMAGE_IDS: Record<string, string> = {
  concerts: "1470229722913-7c0e2dbbafd3",
  comedy: "1527224857830-43a7acc85260",
  theatre: "1503095396549-807759245b35",
  sports: "1461896836934-ffe607ba8211",
  nightlife: "1566737236500-c8ac43014a67",
  dining: "1517248135467-4c7edcad34c4",
  family: "1502086223501-7ea6ecd79368",
  exhibitions: "1531058020387-3be344556be6",
  workshops: "1524178232363-1fb2b075b655",
  attractions: "1513889961551-628c1e5e2ee9",
  conferences: "1540575467063-178a50c2df87",
  launches: "1475721027785-f74eccf877e2",
  staffing: "1522071820081-009f0129c71c",
};

function categoryImage(slug: string): string {
  const id = CATEGORY_IMAGE_IDS[slug] ?? CATEGORY_IMAGE_IDS.concerts;
  return `https://images.unsplash.com/photo-${id}?w=440&h=330&fit=crop&auto=format&q=70`;
}

// Subject-relevant backgrounds for the managed-services cards.
const SERVICE_IMAGE_IDS: Record<string, string> = {
  conferences: "1540575467063-178a50c2df87",
  corporate: "1517048676732-d65bc937f952",
  launches: "1475721027785-f74eccf877e2",
  "private-events": "1519225421980-715cb0215aed",
  staffing: "1522071820081-009f0129c71c",
  "ticketing-services": "1459749411175-04bf5292ceea",
};

function serviceImage(slug: string): string {
  const id = SERVICE_IMAGE_IDS[slug] ?? SERVICE_IMAGE_IDS.conferences;
  return `https://images.unsplash.com/photo-${id}?w=560&h=360&fit=crop&auto=format&q=70`;
}

type MarketplaceClientProps = {
  initialData: MarketplaceDiscoveryResponse;
  initialLocale?: LocaleCode;
  mode?: "home" | "list";
  initialCategory?: string;
  initialQuery?: string;
  initialDate?: string;
};

export function MarketplaceClient({
  initialData,
  initialLocale = "en",
  mode = "home",
  initialCategory = "",
  initialQuery = "",
  initialDate = "",
}: MarketplaceClientProps) {
  const [locale, setLocale] = useState<LocaleCode>(normalizeLocale(initialLocale));
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [dateFilter, setDateFilter] = useState(initialDate);
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const dir = locale === "ar" ? "rtl" : "ltr";
  const events = data.events;
  const heroEvents = events.slice(0, mode === "home" ? 8 : 48);
  const publicCategories = data.categories.filter((item) => item.kind !== "service");
  const serviceCategories = eventCategories.filter((item) => item.kind === "service");
  const popularEvents = events.slice(0, 12);
  const weekendEvents = events
    .filter((event) => {
      const day = new Date(event.startsAt).getDay();
      return day === 5 || day === 6;
    })
    .slice(0, 8);
  const attractionEvents = events.filter((event) => event.categorySlug === "attractions").slice(0, 8);
  const featured = useMemo(() => events[0], [events]);
  // "Happening soon" — events starting within 10 hours float to the top for
  // fast purchase, then the rest by soonest start date.
  const soonEvents = useMemo(() => {
    const now = Date.now();
    const withTime = events.map((event) => ({
      event,
      hours: (new Date(event.startsAt).getTime() - now) / 3_600_000,
    }));
    const fast = withTime
      .filter((x) => x.hours > 0 && x.hours <= 10)
      .sort((a, b) => a.hours - b.hours);
    const rest = withTime
      .filter((x) => !(x.hours > 0 && x.hours <= 10))
      .sort((a, b) => new Date(a.event.startsAt).getTime() - new Date(b.event.startsAt).getTime());
    return [...fast, ...rest]
      .slice(0, 3)
      .map((x) => ({ event: x.event, fast: x.hours > 0 && x.hours <= 10, hours: x.hours }));
  }, [events]);
  const hasFast = soonEvents.some((s) => s.fast);
  const copy = locale === "ar" ? arCopy : enCopy;
  const dateOptions = locale === "ar" ? arDateOptions : enDateOptions;
  const promptCards = locale === "ar" ? arPromptCards : enPromptCards;
  const [quickViewEvent, setQuickViewEvent] = useState<MarketplaceEvent | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("locale", locale);
      if (query.trim()) params.set("q", query.trim());
      if (category) params.set("category", category);
      if (dateFilter) params.set("date", dateFilter);

      const response = await fetch(`/api/events/discover?${params.toString()}`, {
        signal: controller.signal,
      });

      if (response.ok) {
        setData((await response.json()) as MarketplaceDiscoveryResponse);
      }
      setLoading(false);
    }

    load().catch(() => {
      if (!controller.signal.aborted) setLoading(false);
    });

    return () => controller.abort();
  }, [category, dateFilter, locale, query]);

  return (
    <div dir={dir} className="relative min-h-screen overflow-hidden bg-[#050712] text-white">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[#050712]">
        <FloatingLines
          className="absolute inset-0 opacity-95 [filter:brightness(1.18)_contrast(1.12)_saturate(1.08)]"
          enabledWaves={["top", "middle", "bottom"]}
          lineCount={[10, 14, 18]}
          lineDistance={[10, 8, 6]}
          linesGradient={["#38BDF8", "#7C3AED", "#E879F9", "#F59E0B"]}
          topWavePosition={{ x: 4.8, y: 0.5, rotate: -0.2 }}
          middleWavePosition={{ x: 1.0, y: -0.02, rotate: 0.12 }}
          bottomWavePosition={{ x: -0.6, y: -0.58, rotate: -0.36 }}
          animationSpeed={0.6}
          interactive={true}
          bendRadius={7}
          bendStrength={-0.65}
          mouseDamping={0.04}
          parallax={true}
          parallaxStrength={0.08}
          mixBlendMode="screen"
          intensity={1.55}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_16%,rgba(14,165,233,0.08),transparent_34%),radial-gradient(circle_at_18%_82%,rgba(190,24,93,0.06),transparent_36%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,18,0.5)_0%,rgba(5,7,18,0.2)_36%,transparent_78%)]" />
      </div>

      <section className="relative z-10 overflow-hidden px-4 pb-16 pt-24 sm:px-8 lg:px-12 2xl:px-20">
        <div className="absolute inset-0">
          <div className="absolute left-[8%] top-[22%] h-24 w-24 rounded-full border border-cyan-200/10 bg-cyan-200/[0.025] blur-sm" />
          <div className="absolute bottom-[24%] right-[12%] h-36 w-36 rounded-full border border-pink-300/10 bg-pink-300/[0.025] blur-sm" />
        </div>

        <div className="relative z-10 mx-auto flex max-w-none flex-col justify-end">
          <div className="grid items-start gap-10 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="min-w-0">
              <h1 className="text-4xl font-black leading-[0.96] tracking-[-0.03em] text-white sm:text-5xl lg:text-[3.35rem]">
                {copy.titleLead}{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-400 bg-[length:200%_auto] bg-clip-text text-transparent animate-[shine_5s_linear_infinite]">
                  {copy.titleAccent}
                </span>
              </h1>
              <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-white/60">
                {copy.subtitle}
              </p>

              <div className="mt-8 rounded-[2rem] border border-white/16 bg-[#080c18]/82 p-3 shadow-[0_24px_90px_rgba(0,0,0,0.58)] backdrop-blur-2xl">
                <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
                  <label className="flex min-h-14 items-center gap-3 rounded-[1.4rem] bg-black/25 px-5">
                    <Search className="h-5 w-5 shrink-0 text-white/60" />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder={copy.searchPlaceholder}
                      className="w-full bg-transparent text-base font-semibold text-white outline-none placeholder:text-white/45"
                    />
                  </label>
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="min-h-14 rounded-[1.4rem] border border-white/10 bg-black/35 px-5 text-sm font-bold text-white outline-none"
                  >
                    <option value="">{copy.allCategories}</option>
                    {publicCategories.map((item) => (
                      <option key={item.slug} value={item.slug}>
                        {locale === "ar" ? item.labelAr : item.label}
                      </option>
                    ))}
                  </select>
                  <Button asChild className="min-h-14 rounded-[1.4rem] bg-white px-7 font-black text-black hover:bg-white/90">
                    <Link href={`/?${new URLSearchParams({ q: query, category, date: dateFilter }).toString()}`}>
                      {copy.explore}
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap gap-3 text-xs font-black uppercase tracking-[0.18em] text-white/55">
                {copy.quickStats.map((item) => (
                  <span key={item} className="rounded-full border border-white/14 bg-[#080c18]/75 px-4 py-2 text-white/70 backdrop-blur">
                    {item}
                  </span>
                ))}
              </div>

              {soonEvents.length > 0 ? (
                <div className="mt-8">
                  <div className="mb-4 flex items-center gap-2">
                    <span className={`h-2 w-2 animate-pulse rounded-full ${hasFast ? "bg-rose-400" : "bg-cyan-300"}`} />
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/55">
                      {hasFast
                        ? locale === "ar" ? "الشراء السريع" : "Fast purchase"
                        : locale === "ar" ? "قريبًا" : "Happening soon"}
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {soonEvents.map(({ event, fast, hours }) => (
                      <div
                        key={event.id}
                        className={`group overflow-hidden rounded-[1.5rem] border bg-[#090d19]/75 backdrop-blur transition ${
                          fast ? "border-rose-400/45 shadow-[0_0_28px_rgba(251,113,133,0.22)]" : "border-white/12 hover:border-cyan-200/45"
                        }`}
                      >
                        <div className="relative aspect-[16/9] overflow-hidden">
                          {event.coverImageUrl ? (
                            <img src={event.coverImageUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                          ) : (
                            <div className="absolute inset-0 bg-[linear-gradient(135deg,#1e1b4b,#7c3aed)]" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                          {fast ? (
                            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-lg">
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                              {hours < 1
                                ? locale === "ar" ? "يبدأ الآن" : "Starting now"
                                : `${Math.round(hours)}h ${locale === "ar" ? "متبقّي" : "left"}`}
                            </span>
                          ) : (
                            <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-100 backdrop-blur">
                              {format(new Date(event.startsAt), "EEE, MMM d")}
                            </span>
                          )}
                          <span className="absolute right-3 top-3 rounded-full border border-white/20 bg-black/55 px-3 py-1 text-xs font-black text-white backdrop-blur">
                            {formatMoney(event.minPrice, event.currency, locale)}
                          </span>
                          <div className="absolute inset-x-3 bottom-3">
                            <h3 className="line-clamp-1 text-base font-black text-white">{event.title}</h3>
                            <p className="text-xs font-bold text-white/65">{event.venueName || event.locationText || "Bahrain"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-3">
                          <Button asChild className={`h-10 flex-1 rounded-full text-sm font-black ${fast ? "bg-rose-500 text-white hover:bg-rose-400" : "bg-white text-black hover:bg-white/90"}`}>
                            <Link href={event.buyUrl}>{fast ? (locale === "ar" ? "شراء سريع" : "Fast buy") : (locale === "ar" ? "شراء" : "Buy tickets")}</Link>
                          </Button>
                          <Button
                            type="button"
                            onClick={() => setQuickViewEvent(event)}
                            className="h-10 flex-1 rounded-full border border-white/25 bg-white/10 text-sm font-black text-white hover:bg-white/20"
                          >
                            {locale === "ar" ? "تفاصيل" : "Details"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {featured ? (
              <div className="order-first lg:order-none">
                <HeroFeature event={featured} locale={locale} onQuickView={setQuickViewEvent} />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <main className="relative z-10 mx-auto max-w-none px-4 py-14 before:pointer-events-none before:absolute before:inset-x-0 before:-top-24 before:bottom-0 before:-z-10 before:bg-gradient-to-b before:from-transparent before:via-[#050712]/72 before:to-[#050712]/88 sm:px-8 lg:px-12 2xl:px-20">
        <section className="mb-10 space-y-5">
          <div className="flex flex-wrap justify-center gap-3">
            {dateOptions.map((option) => (
              <button
                key={option.value || "all"}
                type="button"
                onClick={() => setDateFilter(option.value)}
                className={cn(chipBase, dateFilter === option.value ? chipActiveWhite : chipInactive)}
              >
                {dateFilter === option.value ? <BadgeCheck className="chip-check h-4 w-4" /> : null}
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => setCategory("")}
              className={cn(chipBase, !category ? chipActiveCyan : chipInactive)}
            >
              {!category ? <BadgeCheck className="chip-check h-4 w-4" /> : null}
              {copy.allCategories}
            </button>
            {publicCategories.map((item) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => setCategory(item.slug)}
                className={cn(chipBase, category === item.slug ? chipActiveCyan : chipInactive)}
              >
                {category === item.slug ? <BadgeCheck className="chip-check h-4 w-4" /> : null}
                {locale === "ar" ? item.labelAr : item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <div className="mb-7 flex items-end justify-between gap-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-pink-300">{copy.discover}</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">{copy.featured}</h2>
            </div>
            {loading ? <span className="text-sm font-bold text-white/50">{copy.loading}</span> : null}
          </div>

          {heroEvents.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {heroEvents.map((event) => (
                <EventCard key={event.id} event={event} locale={locale} onQuickView={setQuickViewEvent} />
              ))}
            </div>
          ) : (
            <EmptyState title={copy.emptyTitle} body={copy.emptyBody} />
          )}
        </section>

        {mode === "home" && publicCategories.length > 0 ? (
          <section className="mb-16">
            <div className="mb-6">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200">
                {locale === "ar" ? "تصفّح" : "Browse"}
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-4xl">
                {locale === "ar" ? "تصفّح حسب الفئة" : "Browse by category"}
              </h2>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {publicCategories.map((item) => (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => {
                    setCategory(item.slug);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="group relative aspect-[4/3] w-[calc(50%-0.375rem)] overflow-hidden rounded-2xl border border-white/10 text-left sm:w-[calc(33.333%-0.5rem)] lg:w-[calc(20%-0.6rem)]"
                >
                  <img
                    src={categoryImage(item.slug)}
                    alt={item.label}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/10 transition group-hover:from-black/75" />
                  <div className="absolute inset-x-3 bottom-3">
                    <p className="text-sm font-black text-white">{locale === "ar" ? item.labelAr : item.label}</p>
                    {item.count > 0 ? (
                      <p className="text-[11px] font-bold text-cyan-100/80">
                        {item.count} {locale === "ar" ? "فعالية" : item.count === 1 ? "event" : "events"}
                      </p>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {mode === "home" ? (
          <>
            <RailSection title={copy.popularTitle} eyebrow={copy.popularEyebrow} events={popularEvents} locale={locale} onQuickView={setQuickViewEvent} />
            <RailSection title={copy.weekendTitle} eyebrow={copy.weekendEyebrow} events={weekendEvents} locale={locale} onQuickView={setQuickViewEvent} />
            <RailSection title={copy.attractionsTitle} eyebrow={copy.attractionsEyebrow} events={attractionEvents} locale={locale} onQuickView={setQuickViewEvent} />
            <ThingsToDo copy={copy} locale={locale} />
          </>
        ) : null}

        <section className="grid gap-10 border-y border-white/10 py-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200">{copy.servicesEyebrow}</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">{copy.servicesTitle}</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/65">{copy.servicesBody}</p>
            <Button asChild className="mt-8 rounded-full bg-cyan-300 px-7 font-black text-black hover:bg-cyan-200">
              <Link href="/contact">{copy.workWithUs}</Link>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {serviceCategories.map((item) => (
              <Link
                key={item.slug}
                href={`/contact?service=${item.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-white/10 p-5 transition hover:border-cyan-200/40"
              >
                <img
                  src={serviceImage(item.slug)}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-500 group-hover:scale-105 group-hover:opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/25" />
                <div className="relative">
                  <p className="text-lg font-black">{locale === "ar" ? item.labelAr : item.label}</p>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    {serviceBlurbs[item.slug]?.[locale] ?? copy.managedService}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="border-t border-white/10 py-14">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div className="grid gap-5 sm:grid-cols-2">
              {(locale === "ar" ? arTrust : enTrust).map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-300/15 text-cyan-200">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-black">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-white/55">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="lg:text-right">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/45">
                {locale === "ar" ? "طرق دفع آمنة" : "Secure payments"}
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5 lg:justify-end">
                {["Visa", "Mastercard", "Apple Pay", "Benefit", "Google Pay"].map((p) => (
                  <span
                    key={p}
                    className="rounded-lg border border-white/12 bg-white/[0.06] px-3.5 py-2 text-xs font-black text-white/80"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      {quickViewEvent ? (
        <EventQuickView event={quickViewEvent} locale={locale} onClose={() => setQuickViewEvent(null)} />
      ) : null}
    </div>
  );
}

const enTrust = [
  { icon: ShieldCheck, title: "Secure checkout", body: "Encrypted payments with Visa, Mastercard, Apple Pay & Benefit." },
  { icon: Zap, title: "Instant QR tickets", body: "Get your scannable tickets by email the moment you pay." },
  { icon: BadgeCheck, title: "Official ticket seller", body: "Real events curated and managed by the Events Hub team." },
  { icon: Headphones, title: "24/7 support", body: "Help before, during, and after every event you book." },
];

const arTrust = [
  { icon: ShieldCheck, title: "دفع آمن", body: "مدفوعات مشفّرة عبر فيزا وماستركارد وآبل باي وبنفت." },
  { icon: Zap, title: "تذاكر QR فورية", body: "تصلك تذاكرك القابلة للمسح عبر البريد فور الدفع." },
  { icon: BadgeCheck, title: "بائع تذاكر رسمي", body: "فعاليات حقيقية يديرها فريق Events Hub." },
  { icon: Headphones, title: "دعم على مدار الساعة", body: "مساعدة قبل وأثناء وبعد كل حجز." },
];

const serviceBlurbs: Record<string, { en: string; ar: string }> = {
  conferences: {
    en: "Multi-day agendas, badge printing, registration desks, and session check-in.",
    ar: "جداول لعدة أيام، طباعة بطاقات، ومكاتب تسجيل وتسجيل دخول الجلسات.",
  },
  corporate: {
    en: "End-to-end corporate events — invitations, RSVPs, and on-site coordination.",
    ar: "فعاليات الشركات بالكامل — دعوات وتأكيدات حضور وتنسيق في الموقع.",
  },
  launches: {
    en: "Product launches with guest lists, press check-in, and live capture.",
    ar: "إطلاق المنتجات مع قوائم الضيوف وتسجيل الصحافة والتغطية المباشرة.",
  },
  "private-events": {
    en: "Weddings and private parties with discreet, seamless guest management.",
    ar: "أعراس وفعاليات خاصة مع إدارة ضيوف سلسة وراقية.",
  },
  staffing: {
    en: "Trained door staff, scanners, and on-site coordinators for your event.",
    ar: "طاقم بوابة مدرب وأجهزة مسح ومنسقون في الموقع.",
  },
  "ticketing-services": {
    en: "We sell, scan, and reconcile your tickets — online and at the door.",
    ar: "نبيع ونمسح ونسوي تذاكرك — عبر الإنترنت وعند الباب.",
  },
};

function HeroFeature({
  event,
  locale,
  onQuickView,
}: {
  event: MarketplaceEvent;
  locale: LocaleCode;
  onQuickView: (event: MarketplaceEvent) => void;
}) {
  const title = locale === "ar" && event.titleAr ? event.titleAr : event.title;
  const buy = event.hasTickets
    ? locale === "ar"
      ? "شراء التذاكر"
      : "Buy tickets"
    : locale === "ar"
      ? "عرض الفعالية"
      : "View event";

  return (
    <article className="group relative overflow-hidden rounded-[2rem] border border-white/14 bg-[#0a0f1d]/70 shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
      <div className="relative aspect-[16/13]">
        {event.coverImageUrl ? (
          <img src={event.coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#111827,#281052_58%,#0f172a)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/35 to-transparent" />
        <span className="absolute left-5 top-5 rounded-full bg-cyan-300 px-3 py-1 text-xs font-black uppercase tracking-wider text-black shadow-lg">
          {locale === "ar" ? "مميّز" : "Featured"}
        </span>
        {event.category ? (
          <span className="absolute right-5 top-5 rounded-full border border-white/15 bg-black/50 px-3 py-1 text-xs font-bold text-white backdrop-blur">
            {event.category}
          </span>
        ) : null}
        <div className="absolute inset-x-5 bottom-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100/90">
            {format(new Date(event.startsAt), "EEE, MMM d")}
          </p>
          <h3 className="mt-2 line-clamp-2 text-2xl font-black leading-tight text-white sm:text-3xl">{title}</h3>
          <p className="mt-1 flex items-center gap-2 text-sm text-white/70">
            <MapPin className="h-4 w-4 shrink-0 text-cyan-200" />
            {event.venueName || event.locationText || "Bahrain"}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button asChild className="rounded-full bg-white px-6 font-black text-black hover:bg-white/90">
              <Link href={event.buyUrl}>{buy}</Link>
            </Button>
            <Button
              type="button"
              onClick={() => onQuickView(event)}
              className="rounded-full border border-white/30 bg-white/15 px-5 font-black text-white backdrop-blur hover:bg-white/25"
            >
              {locale === "ar" ? "تفاصيل" : "Details"}
            </Button>
            <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-white backdrop-blur">
              {formatMoney(event.minPrice, event.currency, locale)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function EventCard({
  event,
  locale,
  onQuickView,
}: {
  event: MarketplaceEvent;
  locale: LocaleCode;
  onQuickView: (event: MarketplaceEvent) => void;
}) {
  const [saved, setSaved] = useState(false);
  const title = locale === "ar" && event.titleAr ? event.titleAr : event.title;
  const description = locale === "ar" && event.shortDescriptionAr ? event.shortDescriptionAr : event.shortDescription;
  const viewLabel = event.hasTickets
    ? locale === "ar"
      ? "\u0634\u0631\u0627\u0621 \u0627\u0644\u062a\u0630\u0627\u0643\u0631"
      : "Buy tickets"
    : locale === "ar"
      ? "\u0639\u0631\u0636 \u0627\u0644\u0641\u0639\u0627\u0644\u064a\u0629"
      : "View event";

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem("events-hub-favorites") ?? "[]") as string[];
    setSaved(favorites.includes(event.id));
  }, [event.id]);

  function toggleFavorite() {
    const favorites = JSON.parse(localStorage.getItem("events-hub-favorites") ?? "[]") as string[];
    const next = favorites.includes(event.id)
      ? favorites.filter((id) => id !== event.id)
      : [...favorites, event.id];
    localStorage.setItem("events-hub-favorites", JSON.stringify(next));
    setSaved(next.includes(event.id));
  }

  return (
    <article className="group overflow-hidden rounded-[1.6rem] border border-white/12 bg-[#0a0f1d]/80 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-cyan-200/35 hover:bg-[#0d1426]/90">
      <button type="button" onClick={() => onQuickView(event)} className="block w-full text-left">
        <div className="relative aspect-[16/11] overflow-hidden bg-slate-900">
          {event.coverImageUrl ? (
            <img src={event.coverImageUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.18),transparent_28%),linear-gradient(135deg,#111827,#281052_58%,#0f172a)]">
              <Ticket className="h-10 w-10 text-white/55" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/86 via-black/18 to-transparent" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-black shadow-lg">
              {formatMoney(event.minPrice, event.currency, locale)}
            </span>
            {event.category ? (
              <span className="rounded-full border border-white/12 bg-black/50 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                {event.category}
              </span>
            ) : null}
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100/90">
              {format(new Date(event.startsAt), "EEE, MMM d")}
            </p>
            <h3 className="mt-2 line-clamp-2 text-2xl font-black leading-[1.05] text-white">{title}</h3>
          </div>
        </div>
      </button>
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <p className="min-w-0 text-xs font-black uppercase tracking-[0.22em] text-white/40">
            {event.organizerName}
          </p>
          <button
            onClick={toggleFavorite}
            aria-label={saved ? "Remove from favorites" : "Save event"}
            className="rounded-full border border-white/10 p-2 text-white/70 transition hover:text-pink-300"
          >
            <Heart className={saved ? "h-4 w-4 fill-pink-400 text-pink-400" : "h-4 w-4"} />
          </button>
        </div>
        {description ? <p className="line-clamp-2 min-h-12 text-sm leading-6 text-white/66">{description}</p> : null}
        <div className="grid gap-2 text-sm text-white/66">
          <span className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-cyan-200" />
            {format(new Date(event.startsAt), "EEE, MMM d - h:mm a")}
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-cyan-200" />
            {event.venueName || event.locationText || "Bahrain"}
          </span>
          <span className="flex items-center gap-2">
            <UsersRound className="h-4 w-4 shrink-0 text-cyan-200" />
            {event.organizerName}
          </span>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Button asChild className="rounded-full bg-white font-black text-black hover:bg-white/90">
            <Link href={event.buyUrl}>{viewLabel}</Link>
          </Button>
          <Button
            type="button"
            onClick={() => onQuickView(event)}
            className="rounded-full border border-white/30 bg-white/15 px-5 font-black text-white hover:bg-white/25"
          >
            {locale === "ar" ? "\u062a\u0641\u0627\u0635\u064a\u0644" : "Details"}
          </Button>
        </div>
      </div>
    </article>
  );
}

function EventQuickView({
  event,
  locale,
  onClose,
}: {
  event: MarketplaceEvent;
  locale: LocaleCode;
  onClose: () => void;
}) {
  const title = locale === "ar" && event.titleAr ? event.titleAr : event.title;
  const description = locale === "ar" && event.shortDescriptionAr ? event.shortDescriptionAr : event.shortDescription;
  const location = event.venueName || event.locationText || "Bahrain";
  const buyLabel = event.hasTickets
    ? locale === "ar"
      ? "\u0634\u0631\u0627\u0621 \u0627\u0644\u062a\u0630\u0627\u0643\u0631"
      : "Buy tickets"
    : locale === "ar"
      ? "\u0639\u0631\u0636 \u0627\u0644\u0641\u0639\u0627\u0644\u064a\u0629"
      : "View event";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 py-6 backdrop-blur-md" role="dialog" aria-modal="true">
      <div className="relative max-h-[92svh] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/14 bg-[#080d19] text-white shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close event details"
          className="absolute right-4 top-4 z-10 rounded-full border border-white/15 bg-black/45 p-2 text-white/80 backdrop-blur transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative min-h-[300px] bg-slate-900 lg:min-h-[560px]">
            {event.coverImageUrl ? (
              <img src={event.coverImageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full min-h-[300px] items-center justify-center bg-[radial-gradient(circle_at_35%_20%,rgba(56,189,248,0.22),transparent_30%),linear-gradient(135deg,#111827,#2e1065_58%,#0f172a)]">
                <Ticket className="h-16 w-16 text-white/55" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/18 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-black">
                {formatMoney(event.minPrice, event.currency, locale)}
              </span>
              {event.category ? (
                <span className="ms-2 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-xs font-black text-white backdrop-blur">
                  {event.category}
                </span>
              ) : null}
            </div>
          </div>

          <div className="overflow-y-auto p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200">
              {locale === "ar" ? "\u0646\u0638\u0631\u0629 \u0633\u0631\u064a\u0639\u0629" : "Event preview"}
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">{title}</h2>
            {description ? <p className="mt-5 text-base leading-7 text-white/68">{description}</p> : null}

            <div className="mt-7 grid gap-3">
              <DetailRow icon={CalendarDays} label={locale === "ar" ? "\u0627\u0644\u062a\u0627\u0631\u064a\u062e" : "Date"} value={format(new Date(event.startsAt), "EEE, MMM d - h:mm a")} />
              <DetailRow icon={MapPin} label={locale === "ar" ? "\u0627\u0644\u0645\u0648\u0642\u0639" : "Location"} value={location} />
              <DetailRow icon={UsersRound} label={locale === "ar" ? "\u0627\u0644\u0645\u0646\u0638\u0645" : "Hosted by"} value={event.organizerName} />
              <DetailRow icon={Ticket} label={locale === "ar" ? "\u0627\u0644\u062a\u0630\u0627\u0643\u0631" : "Tickets"} value={`${formatMoney(event.minPrice, event.currency, locale)} | ${event.availableTicketCount} ${locale === "ar" ? "\u0646\u0648\u0639" : "available"}`} />
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Button asChild className="rounded-full bg-white py-6 font-black text-black hover:bg-white/90">
                <Link href={event.buyUrl}>{buyLabel}</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full border-white/15 bg-white/[0.04] py-6 font-black text-white hover:bg-white/[0.08]">
                <Link href={event.publicUrl}>{locale === "ar" ? "\u0641\u062a\u062d \u0635\u0641\u062d\u0629 \u0627\u0644\u0641\u0639\u0627\u0644\u064a\u0629" : "Open full event page"}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-cyan-200" />
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">{label}</p>
        <p className="mt-1 text-sm font-bold text-white/78">{value}</p>
      </div>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-10 text-center">
      <Ticket className="mx-auto h-10 w-10 text-white/45" />
      <h3 className="mt-4 text-2xl font-black">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-white/55">{body}</p>
    </div>
  );
}

function RailSection({
  title,
  eyebrow,
  events,
  locale,
  onQuickView,
}: {
  title: string;
  eyebrow: string;
  events: MarketplaceEvent[];
  locale: LocaleCode;
  onQuickView: (event: MarketplaceEvent) => void;
}) {
  if (events.length === 0) return null;

  return (
    <section className="mb-16">
      <div className="mb-6 flex items-center justify-between gap-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-4xl">{title}</h2>
        </div>
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-cyan-200">
          {locale === "ar" ? "\u0639\u0631\u0636 \u0627\u0644\u0643\u0644" : "View all"}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="scrollbar-hide grid auto-cols-[minmax(260px,300px)] grid-flow-col justify-start gap-4 overflow-x-auto pb-2">
        {events.map((event) => (
          <CompactEventCard key={`${title}-${event.id}`} event={event} locale={locale} onQuickView={onQuickView} />
        ))}
      </div>
    </section>
  );
}

function CompactEventCard({
  event,
  locale,
  onQuickView,
}: {
  event: MarketplaceEvent;
  locale: LocaleCode;
  onQuickView: (event: MarketplaceEvent) => void;
}) {
  const title = locale === "ar" && event.titleAr ? event.titleAr : event.title;

  return (
    <button
      type="button"
      onClick={() => onQuickView(event)}
      className="group min-w-[260px] overflow-hidden rounded-2xl border border-white/10 bg-[#0a0f1d]/75 text-left transition hover:border-cyan-200/30 hover:bg-[#0d1426]/90"
    >
      <div className="relative aspect-[16/10] bg-slate-900">
        {event.coverImageUrl ? (
          <img src={event.coverImageUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#0f172a,#164e63)]">
            <Ticket className="h-8 w-8 text-white/60" />
          </div>
        )}
        <span className="absolute bottom-3 left-3 rounded-full bg-white px-3 py-1 text-xs font-black text-black">
          {formatMoney(event.minPrice, event.currency, locale)}
        </span>
      </div>
      <div className="space-y-2 p-4">
        <h3 className="line-clamp-2 min-h-[3rem] text-base font-black leading-6">{title}</h3>
        <p className="text-xs font-bold text-white/55">{format(new Date(event.startsAt), "EEE, MMM d")}</p>
        <p className="line-clamp-1 text-xs text-white/50">{event.venueName || event.locationText || "Bahrain"}</p>
      </div>
    </button>
  );
}

function ThingsToDo({ copy, locale }: { copy: typeof enCopy; locale: LocaleCode }) {
  const items = locale === "ar" ? arThingsToDo : enThingsToDo;

  return (
    <section className="mb-16 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-pink-300">{copy.thingsEyebrow}</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-4xl">{copy.thingsTitle}</h2>
        </div>
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-cyan-200">
          {copy.explore}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-pink-200/40 hover:bg-black/30"
          >
            <p className="text-lg font-black">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-white/55">{item.body}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

const enCopy = {
  eyebrow: "Events Hub Bahrain",
  liveInBahrain: "Live in Bahrain",
  titleLead: "Every event in Bahrain,",
  titleAccent: "ONE HUB",
  title: "Every event in Bahrain, ONE HUB",
  subtitle:
    "Browse curated events, reserve QR tickets, and let our team run ticketing, check-in, and guest ops end to end.",
  quickStats: ["BHD payments", "Arabic + English", "QR tickets", "Managed by Events Hub"],
  searchPlaceholder: "Search events, venues, artists, services...",
  allCategories: "All categories",
  explore: "Explore",
  myTickets: "My tickets",
  discover: "Discover",
  featured: "Featured events",
  loading: "Updating...",
  emptyTitle: "No public events yet",
  emptyBody: "Published events with public ticketing will appear here automatically.",
  servicesEyebrow: "Managed by Events Hub",
  servicesTitle: "Need us to run the event with you?",
  servicesBody:
    "Our admin team can handle ticketing, registration, staffing, check-in devices, guest data, reporting, and attendee communication.",
  workWithUs: "Work with us",
  managedService: "Managed planning, ticketing, and event operations by the Events Hub team.",
  popularEyebrow: "Top events",
  popularTitle: "Most popular events",
  weekendEyebrow: "This weekend",
  weekendTitle: "Weekend plans in Bahrain",
  attractionsEyebrow: "Attractions and experiences",
  attractionsTitle: "Experiences to try",
  thingsEyebrow: "Things to do",
  thingsTitle: "Things to do in Bahrain",
};

const arCopy = {
  eyebrow: "\u0625\u064a\u0641\u0646\u062a\u0633 \u0647\u0628 \u0627\u0644\u0628\u062d\u0631\u064a\u0646",
  liveInBahrain: "\u0645\u0628\u0627\u0634\u0631 \u0641\u064a \u0627\u0644\u0628\u062d\u0631\u064a\u0646",
  titleLead: "\u0643\u0644 \u0641\u0639\u0627\u0644\u064a\u0627\u062a \u0627\u0644\u0628\u062d\u0631\u064a\u0646\u060c",
  titleAccent: "\u0641\u064a \u0645\u0643\u0627\u0646 \u0648\u0627\u062d\u062f.",
  title: "\u0627\u0643\u062a\u0634\u0641 \u0648\u0627\u062d\u062c\u0632 \u0648\u0627\u062d\u0636\u0631 \u0623\u0641\u0636\u0644 \u0641\u0639\u0627\u0644\u064a\u0627\u062a \u0627\u0644\u0628\u062d\u0631\u064a\u0646.",
  subtitle:
    "\u0645\u0646\u0635\u0629 \u0645\u0645\u064a\u0632\u0629 \u0644\u0644\u0641\u0639\u0627\u0644\u064a\u0627\u062a \u0627\u0644\u0639\u0627\u0645\u0629 \u0648\u062a\u062c\u0627\u0631\u0628 \u0627\u0644\u0634\u0631\u0643\u0627\u062a \u0648\u0627\u0644\u062a\u0630\u0627\u0643\u0631 \u0648\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062d\u0636\u0648\u0631 \u0648\u062e\u062f\u0645\u0627\u062a \u0627\u0644\u0632\u0648\u0627\u0631.",
  quickStats: [
    "\u062f\u0641\u0639 \u0628\u0627\u0644\u062f\u064a\u0646\u0627\u0631",
    "\u0639\u0631\u0628\u064a + \u0625\u0646\u062c\u0644\u064a\u0632\u064a",
    "\u062a\u0630\u0627\u0643\u0631 QR",
    "\u0628\u0625\u062f\u0627\u0631\u0629 Events Hub",
  ],
  searchPlaceholder: "\u0627\u0628\u062d\u062b \u0639\u0646 \u0641\u0639\u0627\u0644\u064a\u0629 \u0623\u0648 \u0645\u0643\u0627\u0646 \u0623\u0648 \u062e\u062f\u0645\u0629...",
  allCategories: "\u0643\u0644 \u0627\u0644\u0641\u0626\u0627\u062a",
  explore: "\u0627\u0633\u062a\u0643\u0634\u0641",
  myTickets: "\u062a\u0630\u0627\u0643\u0631\u064a",
  discover: "\u0627\u0643\u062a\u0634\u0641",
  featured: "\u0641\u0639\u0627\u0644\u064a\u0627\u062a \u0645\u062e\u062a\u0627\u0631\u0629",
  loading: "\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u062f\u064a\u062b...",
  emptyTitle: "\u0644\u0627 \u062a\u0648\u062c\u062f \u0641\u0639\u0627\u0644\u064a\u0627\u062a \u0639\u0627\u0645\u0629 \u062d\u0627\u0644\u064a\u0627",
  emptyBody:
    "\u0633\u062a\u0638\u0647\u0631 \u0627\u0644\u0641\u0639\u0627\u0644\u064a\u0627\u062a \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629 \u0648\u0627\u0644\u0645\u062a\u0627\u062d\u0629 \u0644\u0644\u062d\u062c\u0632 \u0647\u0646\u0627 \u062a\u0644\u0642\u0627\u0626\u064a\u0627.",
  servicesEyebrow: "\u0628\u0625\u062f\u0627\u0631\u0629 \u0625\u064a\u0641\u0646\u062a\u0633 \u0647\u0628",
  servicesTitle: "\u0647\u0644 \u062a\u0631\u064a\u062f \u0645\u0646\u0627 \u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0641\u0639\u0627\u0644\u064a\u0629 \u0645\u0639\u0643\u061f",
  servicesBody:
    "\u0641\u0631\u064a\u0642\u0646\u0627 \u064a\u062f\u064a\u0631 \u0627\u0644\u062a\u0630\u0627\u0643\u0631 \u0648\u0627\u0644\u062a\u0633\u062c\u064a\u0644 \u0648\u0627\u0644\u0637\u0627\u0642\u0645 \u0648\u0623\u062c\u0647\u0632\u0629 \u0627\u0644\u062f\u062e\u0648\u0644 \u0648\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0636\u064a\u0648\u0641 \u0648\u0627\u0644\u062a\u0642\u0627\u0631\u064a\u0631 \u0648\u0627\u0644\u062a\u0648\u0627\u0635\u0644 \u0645\u0639 \u0627\u0644\u062d\u0636\u0648\u0631.",
  workWithUs: "\u062a\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627",
  managedService:
    "\u062a\u062e\u0637\u064a\u0637 \u0648\u062a\u0630\u0627\u0643\u0631 \u0648\u062a\u0634\u063a\u064a\u0644 \u0641\u0639\u0627\u0644\u064a\u0627\u062a \u0628\u0625\u062f\u0627\u0631\u0629 \u0641\u0631\u064a\u0642 \u0625\u064a\u0641\u0646\u062a\u0633 \u0647\u0628.",
  popularEyebrow: "\u0623\u0647\u0645 \u0627\u0644\u0641\u0639\u0627\u0644\u064a\u0627\u062a",
  popularTitle: "\u0627\u0644\u0641\u0639\u0627\u0644\u064a\u0627\u062a \u0627\u0644\u0623\u0643\u062b\u0631 \u0637\u0644\u0628\u0627",
  weekendEyebrow: "\u0646\u0647\u0627\u064a\u0629 \u0627\u0644\u0623\u0633\u0628\u0648\u0639",
  weekendTitle: "\u062e\u0637\u0637 \u0646\u0647\u0627\u064a\u0629 \u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0641\u064a \u0627\u0644\u0628\u062d\u0631\u064a\u0646",
  attractionsEyebrow: "\u0648\u062c\u0647\u0627\u062a \u0648\u062a\u062c\u0627\u0631\u0628",
  attractionsTitle: "\u062a\u062c\u0627\u0631\u0628 \u062c\u062f\u064a\u0631\u0629 \u0628\u0627\u0644\u062a\u062c\u0631\u0628\u0629",
  thingsEyebrow: "\u0623\u0634\u064a\u0627\u0621 \u0644\u0644\u0642\u064a\u0627\u0645 \u0628\u0647\u0627",
  thingsTitle: "\u0623\u0634\u064a\u0627\u0621 \u0644\u0644\u0642\u064a\u0627\u0645 \u0628\u0647\u0627 \u0641\u064a \u0627\u0644\u0628\u062d\u0631\u064a\u0646",
};

const enDateOptions = [
  { value: "", label: "All dates" },
  { value: "today", label: "Today" },
  { value: "weekend", label: "This weekend" },
  { value: "month", label: "This month" },
];

const arDateOptions = [
  { value: "", label: "\u0643\u0644 \u0627\u0644\u062a\u0648\u0627\u0631\u064a\u062e" },
  { value: "today", label: "\u0627\u0644\u064a\u0648\u0645" },
  { value: "weekend", label: "\u0646\u0647\u0627\u064a\u0629 \u0627\u0644\u0623\u0633\u0628\u0648\u0639" },
  { value: "month", label: "\u0647\u0630\u0627 \u0627\u0644\u0634\u0647\u0631" },
];

const enPromptCards = [
  {
    title: "Smart discovery",
    body: "Find concerts, attractions, dining, and corporate experiences faster.",
    href: "/events",
  },
  {
    title: "Managed services",
    body: "Our company handles setup, ticketing, check-in, reporting, and support.",
    href: "/contact?service=ticketing-services",
  },
  {
    title: "Your tickets",
    body: "Use guest checkout, then link orders and tickets to your account by email.",
    href: "/account",
  },
];

const arPromptCards = [
  {
    title: "\u0627\u0643\u062a\u0634\u0627\u0641 \u0630\u0643\u064a",
    body: "\u0627\u0628\u062d\u062b \u0639\u0646 \u0627\u0644\u062d\u0641\u0644\u0627\u062a \u0648\u0627\u0644\u0648\u062c\u0647\u0627\u062a \u0648\u0627\u0644\u0645\u0637\u0627\u0639\u0645 \u0648\u062a\u062c\u0627\u0631\u0628 \u0627\u0644\u0634\u0631\u0643\u0627\u062a.",
    href: "/events?locale=ar",
  },
  {
    title: "\u062e\u062f\u0645\u0627\u062a \u0645\u062f\u0627\u0631\u0629",
    body: "\u0634\u0631\u0643\u062a\u0646\u0627 \u062a\u062f\u064a\u0631 \u0627\u0644\u0625\u0639\u062f\u0627\u062f \u0648\u0627\u0644\u062a\u0630\u0627\u0643\u0631 \u0648\u0627\u0644\u062f\u062e\u0648\u0644 \u0648\u0627\u0644\u062a\u0642\u0627\u0631\u064a\u0631.",
    href: "/contact?service=ticketing-services",
  },
  {
    title: "\u062a\u0630\u0627\u0643\u0631\u0643",
    body: "\u0627\u062d\u062c\u0632 \u0643\u0632\u0627\u0626\u0631 \u062b\u0645 \u0627\u0631\u0628\u0637 \u0627\u0644\u0637\u0644\u0628\u0627\u062a \u0648\u0627\u0644\u062a\u0630\u0627\u0643\u0631 \u0628\u062d\u0633\u0627\u0628\u0643.",
    href: "/account",
  },
];

const enThingsToDo = [
  {
    title: "Concerts and shows",
    body: "Live music, theatre, comedy, and cultural nights across Bahrain.",
    href: "/events?category=concerts",
  },
  {
    title: "Attractions and experiences",
    body: "Family days, outdoor activities, dining experiences, and places to visit.",
    href: "/events?category=attractions",
  },
  {
    title: "Corporate and private events",
    body: "Ticketing, registrations, staffing, guest lists, check-in, and reports.",
    href: "/contact?service=corporate",
  },
];

const arThingsToDo = [
  {
    title: "\u062d\u0641\u0644\u0627\u062a \u0648\u0639\u0631\u0648\u0636",
    body: "\u0645\u0648\u0633\u064a\u0642\u0649 \u062d\u064a\u0629 \u0648\u0645\u0633\u0631\u062d \u0648\u0643\u0648\u0645\u064a\u062f\u064a\u0627 \u0648\u0644\u064a\u0627\u0644\u064a \u062b\u0642\u0627\u0641\u064a\u0629.",
    href: "/events?category=concerts&locale=ar",
  },
  {
    title: "\u0648\u062c\u0647\u0627\u062a \u0648\u062a\u062c\u0627\u0631\u0628",
    body: "\u0623\u0646\u0634\u0637\u0629 \u0639\u0627\u0626\u0644\u064a\u0629 \u0648\u062e\u0627\u0631\u062c\u064a\u0629 \u0648\u062a\u062c\u0627\u0631\u0628 \u0645\u0637\u0627\u0639\u0645 \u0648\u0623\u0645\u0627\u0643\u0646 \u0644\u0644\u0632\u064a\u0627\u0631\u0629.",
    href: "/events?category=attractions&locale=ar",
  },
  {
    title: "\u0641\u0639\u0627\u0644\u064a\u0627\u062a \u0627\u0644\u0634\u0631\u0643\u0627\u062a",
    body: "\u062a\u0630\u0627\u0643\u0631 \u0648\u062a\u0633\u062c\u064a\u0644 \u0648\u0637\u0627\u0642\u0645 \u0648\u0642\u0648\u0627\u0626\u0645 \u0636\u064a\u0648\u0641 \u0648\u062a\u0642\u0627\u0631\u064a\u0631.",
    href: "/contact?service=corporate",
  },
];
