"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { BadgeCheck, CalendarDays, ChevronLeft, ChevronRight, Headphones, Heart, Home, MapPin, Search, ShieldCheck, Sparkles, Ticket, User, UsersRound, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Dock from "@/components/ui/dock";
import { AiConcierge } from "@/components/marketplace/ai-concierge";
import { Reveal, Spotlight } from "@/components/visual/reactbits";
import { eventCategories, formatMoney, normalizeLocale, type LocaleCode } from "@/lib/marketplace";
import type { MarketplaceDiscoveryResponse, MarketplaceEvent } from "@/types/marketplace";
import { cn } from "@/lib/utils";

// Shared filter-chip styles. `chip-flash` triggers a one-shot white blink whenever a
// chip becomes active (keyframes in globals.css); the active chips also render an
// inline check icon via `chip-check` so the selection is unmistakable.
const chipBase =
  "group inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-2 text-[10px] font-black transition-all duration-200 cursor-pointer select-none active:scale-95 [-webkit-tap-highlight-color:transparent] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 sm:gap-2 sm:px-5 sm:py-3 sm:text-sm";

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
  const [currentTime] = useState(() => Date.now());
  const [heroIndex, setHeroIndex] = useState(0);
  const heroTouchStart = useRef<number | null>(null);
  const datePickerRef = useRef<HTMLInputElement>(null);
  const dir = locale === "ar" ? "rtl" : "ltr";
  const events = useMemo(() => {
    if (!dateFilter || !["today", "tomorrow"].includes(dateFilter) && !/^\d{4}-\d{2}-\d{2}$/.test(dateFilter)) {
      return data.events;
    }

    const target = new Date();
    if (dateFilter === "tomorrow") target.setDate(target.getDate() + 1);
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateFilter)) {
      const [year, month, day] = dateFilter.split("-").map(Number);
      target.setFullYear(year, month - 1, day);
    }

    return data.events.filter((event) => {
      const startsAt = new Date(event.startsAt);
      return (
        startsAt.getFullYear() === target.getFullYear() &&
        startsAt.getMonth() === target.getMonth() &&
        startsAt.getDate() === target.getDate()
      );
    });
  }, [data.events, dateFilter]);
  const heroEvents = events.slice(0, mode === "home" ? 8 : 48);
  const publicCategories = data.categories.filter((item) => item.kind !== "service");
  const serviceCategories = eventCategories.filter((item) => item.kind === "service");
  const popularEvents = events.slice(0, 12);
  const featured = events[heroIndex % Math.max(events.length, 1)];

  useEffect(() => {
    if (events.length < 2) return;
    const timer = window.setInterval(() => {
      setHeroIndex((index) => (index + 1) % events.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [events.length]);
  // "Happening soon" — events starting within 10 hours float to the top for
  // fast purchase, then the rest by soonest start date.
  const soonEvents = useMemo(() => {
    const withTime = events.map((event) => ({
      event,
      hours: (new Date(event.startsAt).getTime() - currentTime) / 3_600_000,
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
  }, [currentTime, events]);
  const hasFast = soonEvents.some((s) => s.fast);
  const copy = locale === "ar" ? arCopy : enCopy;
  const dateOptions = locale === "ar" ? arDateOptions : enDateOptions;
  const promptCards = locale === "ar" ? arPromptCards : enPromptCards;
  const [quickViewEvent, setQuickViewEvent] = useState<MarketplaceEvent | null>(null);

  useEffect(() => {
    function resetHomeFilters() {
      setQuery("");
      setCategory("");
      setDateFilter("");
      setHeroIndex(0);
      setQuickViewEvent(null);
    }

    window.addEventListener("iticket:home-reset", resetHomeFilters);
    return () => window.removeEventListener("iticket:home-reset", resetHomeFilters);
  }, []);

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

  function openDatePicker() {
    const input = datePickerRef.current;
    if (!input) return;

    try {
      input.showPicker();
      return;
    } catch {
      input.focus();
      input.click();
    }
  }

  return (
    <div dir={dir} className="home-page-surface relative min-h-screen overflow-hidden bg-white text-slate-900 dark:bg-slate-950 dark:text-white">
      <section className="relative z-10 overflow-hidden bg-white px-0 pb-0 pt-20 dark:bg-slate-950">
        <div className="relative z-10 mx-auto flex max-w-none flex-col justify-end">
          <div className="hidden mb-6 flex-col justify-between gap-4 md:flex-row md:items-center">
            <h1 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              {locale === "ar" ? "أشياء يمكن القيام بها في " : "Things to do in "}
              <span className="text-blue-600">Cairo</span>
            </h1>
            <div className="flex flex-wrap gap-2">
              {dateOptions.map((option) => (
                <button
                  key={option.value || "all"}
                  type="button"
                  onClick={() => setDateFilter(option.value)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-bold transition",
                    dateFilter === option.value
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 bg-white text-slate-800 hover:border-blue-300"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid items-start gap-8">
            <div className="hidden min-w-0">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
                <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
                  <label className="flex min-h-12 items-center gap-3 rounded-xl bg-white px-5">
                    <Search className="h-5 w-5 shrink-0 text-slate-600" />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder={copy.searchPlaceholder}
                      className="w-full bg-transparent text-base font-semibold text-slate-900 outline-none placeholder:text-slate-600"
                    />
                  </label>
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="min-h-12 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 outline-none"
                  >
                    <option value="">{copy.allCategories}</option>
                    {publicCategories.map((item) => (
                      <option key={item.slug} value={item.slug}>
                        {locale === "ar" ? item.labelAr : item.label}
                      </option>
                    ))}
                  </select>
                  <Button asChild className="min-h-12 rounded-xl bg-blue-600 px-7 font-black text-white hover:bg-blue-700">
                    <Link href={`/?${new URLSearchParams({ q: query, category, date: dateFilter }).toString()}`}>
                      {copy.explore}
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3 text-xs font-black uppercase tracking-[0.18em] text-slate-600">
                {copy.quickStats.map((item) => (
                  <span key={item} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-600">
                    {item}
                  </span>
                ))}
              </div>

              {soonEvents.length > 0 ? (
                <div className="mt-7">
                  <div className="mb-4 flex items-center gap-2">
                    <span className={`h-2 w-2 animate-pulse rounded-full ${hasFast ? "bg-rose-400" : "bg-cyan-300"}`} />
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-600">
                      {hasFast
                        ? locale === "ar" ? "الشراء السريع" : "Fast purchase"
                        : locale === "ar" ? "قريبًا" : "Happening soon"}
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {soonEvents.map(({ event, fast, hours }) => (
                      <div
                        key={event.id}
                        className={`group overflow-hidden rounded-[1.5rem] border bg-white shadow-[0_12px_36px_rgba(15,23,42,0.08)] transition ${
                          fast ? "border-rose-400/45 shadow-[0_0_28px_rgba(251,113,133,0.22)]" : "border-slate-200 hover:border-blue-300"
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
                            <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur">
                              {format(new Date(event.startsAt), "EEE, MMM d")}
                            </span>
                          )}
                          <span className="absolute right-3 top-3 rounded-full border border-white/25 bg-black/55 px-3 py-1 text-xs font-black text-white backdrop-blur">
                            {formatMoney(event.minPrice, event.currency, locale)}
                          </span>
                          <div className="absolute inset-x-3 bottom-3">
                            <h3 className="line-clamp-1 text-base font-black text-white">{event.title}</h3>
                            <p className="text-xs font-bold text-white/75">{event.venueName || event.locationText || "Bahrain"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-3">
                          <Button asChild className={`h-10 flex-1 rounded-full text-sm font-black ${fast ? "bg-rose-500 text-white hover:bg-rose-400" : "bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:opacity-95"}`}>
                            <Link href={event.buyUrl}>{fast ? (locale === "ar" ? "شراء سريع" : "Fast buy") : (locale === "ar" ? "شراء" : "Buy tickets")}</Link>
                          </Button>
                          <Button
                            type="button"
                            onClick={() => setQuickViewEvent(event)}
                            className="h-10 flex-1 rounded-full border border-slate-300 bg-slate-100 text-sm font-black text-slate-900 hover:bg-slate-200"
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
              <div
                className="relative order-first mx-auto w-full max-w-[1280px]"
                onTouchStart={(event) => { heroTouchStart.current = event.touches[0]?.clientX ?? null; }}
                onTouchEnd={(event) => {
                  const start = heroTouchStart.current;
                  const end = event.changedTouches[0]?.clientX;
                  heroTouchStart.current = null;
                  if (start == null || end == null || Math.abs(end - start) < 40 || events.length < 2) return;
                  setHeroIndex((index) => (index + (end < start ? 1 : -1) + events.length) % events.length);
                }}
              >
                <HeroFeature event={featured} locale={locale} onQuickView={setQuickViewEvent} />
                {events.length > 1 ? (
                  <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-between px-4 sm:flex">
                    <button type="button" aria-label="Previous featured event" onClick={() => setHeroIndex((index) => (index - 1 + events.length) % events.length)} className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg transition hover:bg-white">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button type="button" aria-label="Next featured event" onClick={() => setHeroIndex((index) => (index + 1) % events.length)} className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg transition hover:bg-white">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
          <nav aria-label="Browse event categories" className="hidden min-h-14 items-center justify-center gap-7 overflow-x-auto bg-[#272727] px-5 text-xs font-black uppercase tracking-[0.08em] text-white sm:gap-10 sm:text-sm">
            {[
              { label: locale === "ar" ? "موسيقى" : "Music", value: "concerts" },
              { label: locale === "ar" ? "كوميديا" : "Comedy", value: "comedy" },
              { label: locale === "ar" ? "عائلي" : "Family", value: "family" },
              { label: locale === "ar" ? "العروض" : "Shows", value: "" },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setCategory(item.value)}
                className={cn("shrink-0 transition hover:text-cyan-300", category === item.value && "text-cyan-300")}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <nav aria-label="Filter events by date" className="flex min-h-14 items-center justify-center gap-2 overflow-x-auto border-y border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 sm:min-h-16 sm:gap-3 sm:px-5 sm:text-sm">
            <button
              type="button"
              onClick={() => setDateFilter("today")}
              className={cn("shrink-0 whitespace-nowrap rounded-full px-3 py-2 transition sm:px-4", dateFilter === "today" ? "bg-cyan-500 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800")}
            >
              {locale === "ar" ? "اليوم" : "Today"}
            </button>
            <button
              type="button"
              onClick={() => setDateFilter("tomorrow")}
              className={cn("shrink-0 whitespace-nowrap rounded-full px-3 py-2 transition sm:px-4", dateFilter === "tomorrow" ? "bg-cyan-500 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800")}
            >
              {locale === "ar" ? "غدًا" : "Tomorrow"}
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={openDatePicker}
                className={cn("flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-full px-3 py-2 transition sm:gap-2 sm:px-4", /^\d{4}-\d{2}-\d{2}$/.test(dateFilter) ? "bg-cyan-500 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800")}
              >
                <CalendarDays className="h-4 w-4" />
                <span>{locale === "ar" ? "اختر تاريخًا" : "Choose a date"}</span>
              </button>
              <input
                ref={datePickerRef}
                type="date"
                value={/^\d{4}-\d{2}-\d{2}$/.test(dateFilter) ? dateFilter : ""}
                onChange={(event) => setDateFilter(event.target.value)}
                aria-label="Choose an event date"
                className="pointer-events-none absolute h-px w-px opacity-0"
              />
            </div>
          </nav>
        </div>
      </section>

      {/* Content sits directly on the light page. (A dark #050712 scrim used to
          live here for the old dark theme — it covered the whole content area.) */}
      <main className="relative z-10 mx-auto max-w-6xl bg-white px-4 py-7 dark:bg-slate-950 sm:px-8 sm:py-14 lg:px-12">
        <section className="mb-7 sm:mb-12">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
            <button
              type="button"
              onClick={() => setCategory("")}
              className={cn(chipBase, "col-span-2 w-full justify-center", !category ? "border-cyan-500 bg-cyan-500 text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800")}
            >
              {!category ? <BadgeCheck className="chip-check h-4 w-4" /> : null}
              {copy.allCategories}
            </button>
            {publicCategories.map((item) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => setCategory(item.slug)}
                className={cn(chipBase, "w-full justify-center whitespace-nowrap sm:w-auto", category === item.slug ? "border-cyan-500 bg-cyan-500 text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800")}
              >
                {category === item.slug ? <BadgeCheck className="chip-check h-4 w-4" /> : null}
                {locale === "ar" ? item.labelAr : item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-20">
          <div className="mb-7 flex items-end justify-between gap-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">{locale === "ar" ? "الأحدث" : "What's new"}</p>
              <h2 className="mt-2 text-3xl font-black uppercase tracking-tight sm:text-5xl">{locale === "ar" ? "فعاليات مختارة" : "Upcoming events"}</h2>
            </div>
            {loading ? <span className="text-sm font-bold text-slate-600">{copy.loading}</span> : null}
          </div>

          {heroEvents.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
            <Reveal className="mb-6">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
                {locale === "ar" ? "تصفّح" : "Browse"}
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-4xl">
                {locale === "ar" ? "تصفّح حسب الفئة" : "Browse by category"}
              </h2>
            </Reveal>
            <div className="flex flex-wrap justify-center gap-3">
              {publicCategories.map((item) => (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => {
                    setCategory(item.slug);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="group relative aspect-[4/3] w-[calc(50%-0.375rem)] overflow-hidden rounded-2xl border border-slate-200 text-left sm:w-[calc(33.333%-0.5rem)] lg:w-[calc(20%-0.6rem)]"
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
                      <p className="text-[11px] font-bold text-cyan-200">
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
          </>
        ) : null}

        <section className="grid gap-10 border-y border-slate-200 py-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">{copy.servicesEyebrow}</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">{copy.servicesTitle}</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">{copy.servicesBody}</p>
            <Button asChild className="mt-8 rounded-full bg-cyan-300 px-7 font-black text-black hover:bg-cyan-200">
              <Link href="/contact">{copy.workWithUs}</Link>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {serviceCategories.map((item) => (
              <Link
                key={item.slug}
                href={`/contact?service=${item.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 p-5 transition hover:border-cyan-200/40"
              >
                <img
                  src={serviceImage(item.slug)}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-500 group-hover:scale-105 group-hover:opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/25" />
                <div className="relative">
                  <p className="text-lg font-black text-white">{locale === "ar" ? item.labelAr : item.label}</p>
                  <p className="mt-2 text-sm leading-6 text-white/80">
                    {serviceBlurbs[item.slug]?.[locale] ?? copy.managedService}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="border-t border-slate-200 py-14">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div className="grid gap-5 sm:grid-cols-2">
              {(locale === "ar" ? arTrust : enTrust).map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-300/15 text-blue-600">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-black">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="lg:text-right">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-600">
                {locale === "ar" ? "طرق دفع آمنة" : "Secure payments"}
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5 lg:justify-end">
                {["Visa", "Mastercard", "Apple Pay", "Benefit", "Google Pay"].map((p) => (
                  <span
                    key={p}
                    className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-800"
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

      {/* Keep the public quick-nav identical before and after sign-in. */}
      {false ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 hidden justify-center md:flex">
          <div className="pointer-events-auto">
            <Dock
              panelHeight={64}
              baseItemSize={46}
              magnification={72}
              disableMagnification
              items={[
                {
                  icon: <Home className="h-5 w-5 text-blue-600" />,
                  label: locale === "ar" ? "الرئيسية" : "Home",
                  onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
                },
                {
                  icon: <Search className="h-5 w-5 text-slate-800" />,
                  label: locale === "ar" ? "بحث" : "Search",
                  onClick: () => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    setTimeout(() => document.querySelector<HTMLInputElement>('input[placeholder]')?.focus(), 500);
                  },
                },
                {
                  icon: <Heart className="h-5 w-5 text-slate-800" />,
                  label: locale === "ar" ? "المفضلة" : "Favourite",
                  onClick: () => { window.location.href = "/account/favorites"; },
                },
                {
                  icon: <CalendarDays className="h-5 w-5 text-slate-800" />,
                  label: locale === "ar" ? "فعالية خاصة" : "Private Event",
                  onClick: () => { window.location.href = "/contact?service=private-events"; },
                },
                {
                  icon: <User className="h-5 w-5 text-slate-800" />,
                  label: locale === "ar" ? "الملف الشخصي" : "Profile",
                  onClick: () => { window.location.href = "/account"; },
                },
              ]}
            />
          </div>
        </div>
      ) : null}

      <AiConcierge locale={locale} />
    </div>
  );
}

const enTrust = [
  { icon: ShieldCheck, title: "Secure checkout", body: "Encrypted payments with Visa, Mastercard, Apple Pay & Benefit." },
  { icon: Zap, title: "Instant QR tickets", body: "Get your scannable tickets by email the moment you pay." },
  { icon: BadgeCheck, title: "Official ticket seller", body: "Real events curated and managed by the iTicket team." },
  { icon: Headphones, title: "24/7 support", body: "Help before, during, and after every event you book." },
];

const arTrust = [
  { icon: ShieldCheck, title: "دفع آمن", body: "مدفوعات مشفّرة عبر فيزا وماستركارد وآبل باي وبنفت." },
  { icon: Zap, title: "تذاكر QR فورية", body: "تصلك تذاكرك القابلة للمسح عبر البريد فور الدفع." },
  { icon: BadgeCheck, title: "بائع تذاكر رسمي", body: "فعاليات حقيقية يديرها فريق iTicket." },
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
    <article className="group relative overflow-hidden bg-black">
      <div className="relative aspect-[16/10] sm:aspect-[5/2]">
        {event.coverImageUrl ? (
          <img src={event.coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#111827,#281052_58%,#0f172a)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/35 to-transparent" />
        {false && <span className="absolute left-4 top-4 rounded-full bg-cyan-300 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-black shadow-lg sm:left-5 sm:top-5 sm:px-3 sm:text-xs">
          {locale === "ar" ? "مميّز" : "Featured"}
        </span>}
        {event.category ? (
          <span className="absolute right-4 top-4 rounded-full border border-white/25 bg-black/50 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur sm:right-5 sm:top-5 sm:px-3 sm:text-xs">
            {event.category}
          </span>
        ) : null}
        <div className="absolute inset-x-4 bottom-4 sm:inset-x-5 sm:bottom-5">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-200 sm:text-xs sm:tracking-[0.18em]">
            {format(new Date(event.startsAt), "EEE, MMM d")}
          </p>
          <h3 className="mt-1 line-clamp-2 text-xl font-black leading-tight text-white sm:mt-2 sm:text-3xl">{title}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-white/75 sm:gap-2 sm:text-sm">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-cyan-300 sm:h-4 sm:w-4" />
            {event.venueName || event.locationText || "Bahrain"}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-5 sm:gap-3">
            <Button asChild className="h-10 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-4 text-sm font-black text-white hover:opacity-95 sm:px-6">
              <Link href={event.buyUrl}>{buy}</Link>
            </Button>
            <Button
              type="button"
              onClick={() => { window.location.href = event.publicUrl; }}
              className="h-10 rounded-full border border-white/30 bg-white/15 px-4 text-sm font-black text-white backdrop-blur hover:bg-white/25 sm:px-5"
            >
              {locale === "ar" ? "تفاصيل" : "Details"}
            </Button>
            <span className="rounded-full bg-white px-3 py-2 text-xs font-black text-slate-900 shadow sm:px-4 sm:text-sm">
              {formatMoney(event.minPrice, event.currency, locale)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

/** Adapts a marketplace event to the ModalCards item shape (home + events pages). */
export function eventToModalCard(event: MarketplaceEvent, locale: LocaleCode) {
  const ar = locale === "ar";
  const title = ar && event.titleAr ? event.titleAr : event.title;
  const description = ar && event.shortDescriptionAr ? event.shortDescriptionAr : event.shortDescription;
  const image =
    event.coverImageUrl ?? categoryImage(event.categorySlug ?? "concerts");
  return {
    id: event.id,
    image,
    title,
    subtitle: `${format(new Date(event.startsAt), "EEE, MMM d · h:mm a")}${event.venueName ? ` · ${event.venueName}` : ""}`,
    badge: formatMoney(event.minPrice, event.currency, locale),
    content: (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800">
            <CalendarDays className="h-3.5 w-3.5 text-blue-600" />
            {format(new Date(event.startsAt), "EEEE, MMMM d, yyyy · h:mm a")}
          </span>
          {event.venueName ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800">
              <MapPin className="h-3.5 w-3.5 text-pink-700" />
              {event.venueName}
            </span>
          ) : null}
          {event.category ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800">
              <Sparkles className="h-3.5 w-3.5 text-violet-500" />
              {event.category}
            </span>
          ) : null}
        </div>
        {description ? <p className="text-base leading-7 text-slate-600">{description}</p> : null}
        <p className="text-sm font-bold text-slate-600">{event.organizerName}</p>
      </div>
    ),
    actions: (
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-lg font-black text-slate-900">
          {formatMoney(event.minPrice, event.currency, locale)}
          <span className="ms-2 text-xs font-bold uppercase tracking-wider text-slate-600">
            {ar ? "يبدأ من" : "from"}
          </span>
        </p>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="rounded-full border-slate-300 bg-transparent font-black text-slate-900 hover:bg-slate-100 hover:text-slate-900">
            <Link href={event.publicUrl}>{ar ? "التفاصيل" : "Details"}</Link>
          </Button>
          <Button asChild className="rounded-full bg-cyan-300 px-6 font-black text-black hover:bg-cyan-200">
            <Link href={event.buyUrl}>
              {event.hasTickets ? (ar ? "شراء التذاكر" : "Buy tickets") : ar ? "عرض الفعالية" : "View event"}
            </Link>
          </Button>
        </div>
      </div>
    ),
  };
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
    <Spotlight className="rounded-[1.6rem]">
    <article className="group overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white text-slate-900 shadow-[0_16px_50px_rgba(15,23,42,0.10)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:bg-slate-50">
      <button type="button" onClick={() => { window.location.href = event.publicUrl; }} className="block w-full text-left">
        <div className="relative aspect-[16/11] overflow-hidden bg-slate-900">
          {event.coverImageUrl ? (
            <img src={event.coverImageUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.18),transparent_28%),linear-gradient(135deg,#111827,#281052_58%,#0f172a)]">
              <Ticket className="h-10 w-10 text-slate-600" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/86 via-black/18 to-transparent" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-black shadow-lg">
              {formatMoney(event.minPrice, event.currency, locale)}
            </span>
            {event.category ? (
              <span className="rounded-full border border-white/25 bg-black/50 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                {event.category}
              </span>
            ) : null}
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
              {format(new Date(event.startsAt), "EEE, MMM d")}
            </p>
            <h3 className="mt-2 line-clamp-2 text-2xl font-black leading-[1.05] text-white">{title}</h3>
          </div>
        </div>
      </button>
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-lg font-black leading-tight text-slate-950">{title}</h3>
            <p className="mt-2 text-xs font-black uppercase tracking-[0.22em] text-slate-700">
            {event.organizerName}
            </p>
          </div>
          <button
            onClick={toggleFavorite}
            aria-label={saved ? "Remove from favorites" : "Save event"}
            className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:text-pink-700"
          >
            <Heart className={saved ? "h-4 w-4 fill-pink-400 text-pink-400" : "h-4 w-4"} />
          </button>
        </div>
        {description ? <p className="line-clamp-2 min-h-12 text-sm leading-6 text-slate-700">{description}</p> : null}
        <div className="grid gap-2 text-sm font-medium text-slate-700">
          <span className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-blue-600" />
            {format(new Date(event.startsAt), "EEE, MMM d - h:mm a")}
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-blue-600" />
            {event.venueName || event.locationText || "Bahrain"}
          </span>
          <span className="flex items-center gap-2">
            <UsersRound className="h-4 w-4 shrink-0 text-blue-600" />
            {event.organizerName}
          </span>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Button asChild className="rounded-full bg-gradient-to-r from-blue-600 to-violet-600 font-black text-white hover:opacity-95">
            <Link href={event.buyUrl}>{viewLabel}</Link>
          </Button>
          <Button
            type="button"
            onClick={() => { window.location.href = event.publicUrl; }}
            className="rounded-full border border-slate-300 bg-slate-100 px-5 font-black text-slate-900 hover:bg-slate-200"
          >
            {locale === "ar" ? "\u062a\u0641\u0627\u0635\u064a\u0644" : "Details"}
          </Button>
        </div>
      </div>
    </article>
    </Spotlight>
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
      <div className="relative max-h-[92svh] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white text-slate-900 shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close event details"
          className="absolute right-4 top-4 z-10 rounded-full border border-slate-300 bg-black/45 p-2 text-white backdrop-blur transition hover:bg-black/60"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative min-h-[300px] bg-slate-900 lg:min-h-[560px]">
            {event.coverImageUrl ? (
              <img src={event.coverImageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full min-h-[300px] items-center justify-center bg-[radial-gradient(circle_at_35%_20%,rgba(56,189,248,0.22),transparent_30%),linear-gradient(135deg,#111827,#2e1065_58%,#0f172a)]">
                <Ticket className="h-16 w-16 text-slate-600" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/18 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-black">
                {formatMoney(event.minPrice, event.currency, locale)}
              </span>
              {event.category ? (
                <span className="ms-2 rounded-full border border-white/25 bg-black/45 px-3 py-1 text-xs font-black text-white backdrop-blur">
                  {event.category}
                </span>
              ) : null}
            </div>
          </div>

          <div className="overflow-y-auto p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
              {locale === "ar" ? "\u0646\u0638\u0631\u0629 \u0633\u0631\u064a\u0639\u0629" : "Event preview"}
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">{title}</h2>
            {description ? <p className="mt-5 text-base leading-7 text-slate-600">{description}</p> : null}

            <div className="mt-7 grid gap-3">
              <DetailRow icon={CalendarDays} label={locale === "ar" ? "\u0627\u0644\u062a\u0627\u0631\u064a\u062e" : "Date"} value={format(new Date(event.startsAt), "EEE, MMM d - h:mm a")} />
              <DetailRow icon={MapPin} label={locale === "ar" ? "\u0627\u0644\u0645\u0648\u0642\u0639" : "Location"} value={location} />
              <DetailRow icon={UsersRound} label={locale === "ar" ? "\u0627\u0644\u0645\u0646\u0638\u0645" : "Hosted by"} value={event.organizerName} />
              <DetailRow icon={Ticket} label={locale === "ar" ? "\u0627\u0644\u062a\u0630\u0627\u0643\u0631" : "Tickets"} value={`${formatMoney(event.minPrice, event.currency, locale)} | ${event.availableTicketCount} ${locale === "ar" ? "\u0646\u0648\u0639" : "available"}`} />
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Button asChild className="rounded-full bg-gradient-to-r from-blue-600 to-violet-600 py-6 font-black text-white hover:opacity-95">
                <Link href={event.buyUrl}>{buyLabel}</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full border-slate-300 bg-white py-6 font-black text-slate-900 hover:bg-slate-50">
                <Link href={event.publicUrl}>{locale === "ar" ? "\u0641\u062a\u062d \u0635\u0641\u062d\u0629 \u0627\u0644\u0641\u0639\u0627\u0644\u064a\u0629" : "Open full event page"}</Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent("eh-ask-ai", {
                      detail: { eventId: event.id, title: locale === "ar" && event.titleAr ? event.titleAr : event.title },
                    })
                  );
                  onClose();
                }}
                className="rounded-full border-blue-300 bg-blue-50 py-6 font-black text-blue-600 hover:bg-blue-100 sm:col-span-2"
              >
                <Sparkles className="me-2 h-4 w-4" />
                {locale === "ar" ? "\u0627\u0633\u0623\u0644 \u0627\u0644\u0630\u0643\u0627\u0621 \u0639\u0646 \u0647\u0627\u0644\u0641\u0639\u0627\u0644\u064a\u0629" : "Ask AI about this event"}
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
    <div className="flex gap-3 rounded-2xl border border-slate-200 bg-white/[0.045] p-4">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-600">{label}</p>
        <p className="mt-1 text-sm font-bold text-slate-600">{value}</p>
      </div>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center">
      <Ticket className="mx-auto h-10 w-10 text-slate-600" />
      <h3 className="mt-4 text-2xl font-black">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-slate-600">{body}</p>
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
        <Reveal>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-4xl">{title}</h2>
        </Reveal>
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-blue-600">
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
      onClick={() => { window.location.href = event.publicUrl; }}
      className="group min-w-[260px] overflow-hidden rounded-2xl border border-slate-200 bg-white text-left text-slate-950 transition hover:border-blue-300 hover:bg-slate-50"
    >
      <div className="relative aspect-[16/10] bg-slate-900">
        {event.coverImageUrl ? (
          <img src={event.coverImageUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#0f172a,#164e63)]">
            <Ticket className="h-8 w-8 text-slate-600" />
          </div>
        )}
        <span className="absolute bottom-3 left-3 rounded-full bg-white px-3 py-1 text-xs font-black text-black">
          {formatMoney(event.minPrice, event.currency, locale)}
        </span>
      </div>
      <div className="space-y-2 p-4">
        <h3 className="line-clamp-2 min-h-[3rem] text-base font-black leading-6 text-slate-950">{title}</h3>
        <p className="text-xs font-bold text-slate-700">{format(new Date(event.startsAt), "EEE, MMM d")}</p>
        <p className="line-clamp-1 text-xs font-medium text-slate-700">{event.venueName || event.locationText || "Bahrain"}</p>
      </div>
    </button>
  );
}

const enCopy = {
  eyebrow: "iTicket Cairo",
  liveInBahrain: "Live in Cairo",
  titleLead: "Every event,",
  titleAccent: "iTicket",
  title: "Every event, iTicket",
  subtitle:
    "Browse curated events, reserve QR tickets, and let our team run ticketing, check-in, and guest ops end to end.",
  quickStats: ["BHD payments", "Arabic + English", "QR tickets", "Managed by iTicket"],
  searchPlaceholder: "Search events, venues, artists, services...",
  allCategories: "All categories",
  explore: "Explore",
  myTickets: "My tickets",
  discover: "Discover",
  featured: "Featured events",
  loading: "Updating...",
  emptyTitle: "No public events yet",
  emptyBody: "Published events with public ticketing will appear here automatically.",
  servicesEyebrow: "Managed by iTicket",
  servicesTitle: "Need us to run the event with you?",
  servicesBody:
    "Our admin team can handle ticketing, registration, staffing, check-in devices, guest data, reporting, and attendee communication.",
  workWithUs: "Work with us",
  managedService: "Managed planning, ticketing, and event operations by the iTicket team.",
  popularEyebrow: "Top events",
  popularTitle: "Most popular events",
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
    "\u0628\u0625\u062f\u0627\u0631\u0629 iTicket",
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

