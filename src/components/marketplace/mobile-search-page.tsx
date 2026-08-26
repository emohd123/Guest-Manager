"use client";

import Link from "next/link";
import { Heart, MapPin, Search, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/lib/marketplace";
import type { MarketplaceEvent } from "@/types/marketplace";

type Props = {
  initialEvents: MarketplaceEvent[];
  locale: "en" | "ar";
  mode?: "search" | "favorites";
  initialQuery?: string;
};

function localizedTitle(event: MarketplaceEvent, locale: "en" | "ar") {
  return locale === "ar" && event.titleAr ? event.titleAr : event.title;
}

function eventHref(event: MarketplaceEvent, locale: "en" | "ar") {
  const separator = event.publicUrl.includes("?") ? "&" : "?";
  return `${event.publicUrl}${separator}locale=${locale}`;
}

function eventDate(startsAt: string, locale: "en" | "ar") {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(startsAt));
}

function eventPrice(event: MarketplaceEvent, locale: "en" | "ar") {
  if (!event.hasTickets || event.availableTicketCount <= 0) return locale === "ar" ? "نفدت التذاكر" : "Sold out";
  if (event.minPrice === null || event.minPrice <= 0) return locale === "ar" ? "مجاني" : "Free";
  return formatMoney(event.minPrice, event.currency || "EGP", locale);
}

export function MobileSearchPage({ initialEvents, locale, mode = "search", initialQuery = "" }: Props) {
  const isArabic = locale === "ar";
  const [query, setQuery] = useState(initialQuery);
  const [saved, setSaved] = useState<string[] | null>(null);

  useEffect(() => {
    try {
      setSaved(JSON.parse(localStorage.getItem("events-hub-favorites") ?? "[]") as string[]);
    } catch {
      setSaved([]);
    }
  }, []);

  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    const source = mode === "favorites" ? initialEvents.filter((event) => saved?.includes(event.id)) : initialEvents;
    if (!normalized) return source;
    return source.filter((event) => {
      const searchable = [event.title, event.titleAr, event.category, event.venueName, event.locationText, event.companyName]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase();
      return searchable.includes(normalized);
    });
  }, [initialEvents, mode, query, saved]);

  function toggleSaved(id: string) {
    setSaved((current) => {
      const existing = current ?? [];
      const next = existing.includes(id) ? existing.filter((item) => item !== id) : [...existing, id];
      localStorage.setItem("events-hub-favorites", JSON.stringify(next));
      return next;
    });
  }

  return (
    <div dir={isArabic ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 pb-24 pt-[4.25rem] text-slate-950 transition-colors dark:bg-slate-950 dark:text-white sm:pb-28 sm:pt-20">
      <div className="mx-auto w-full max-w-6xl px-3 sm:px-6 lg:px-8">
        <div className="mb-3 hidden items-center justify-between sm:flex">
          <Link href={`/?locale=${locale}`} className="text-xs font-bold text-cyan-700 hover:text-cyan-600 dark:text-cyan-300 dark:hover:text-cyan-200">{isArabic ? "العودة للرئيسية" : "Back to home"}</Link>
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">iTicket</span>
        </div>

        {mode === "search" ? <div className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:border-cyan-400 dark:focus-within:ring-cyan-900/50 sm:h-12 sm:rounded-[1.15rem] sm:px-4">
          <Search className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400 sm:h-5 sm:w-5" />
          <input
            autoFocus
            aria-label={isArabic ? "البحث عن الفعاليات" : "Search events"}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={isArabic ? "ابحث عن فعاليات وفنانين وأماكن" : "Find events, artists & venues"}
            className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-slate-950 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500 sm:text-base"
          />
          {query ? <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"><X className="h-4 w-4" /></button> : <Sparkles className="h-5 w-5 shrink-0 text-cyan-600 dark:text-cyan-300" />}
        </div> : null}

        <section className="mt-3 sm:mt-5">
          <div className="mb-2.5 flex items-end justify-between sm:mb-4">
            <h1 className="text-xl font-black tracking-tight sm:text-3xl">{mode === "favorites" ? (isArabic ? "المفضلة" : "Favourite events") : query ? (isArabic ? "نتائج البحث" : "Search results") : (isArabic ? "الأكثر رواجاً" : "Popular")}</h1>
            <span className="pb-0.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500">{results.length}</span>
          </div>

          <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-3">
            {results.map((event) => {
              const soldOut = !event.hasTickets || event.availableTicketCount <= 0;
              const isSaved = saved?.includes(event.id) ?? false;
              return (
                <article key={event.id} className="group flex min-w-0 gap-2.5 rounded-2xl border border-transparent p-1.5 transition hover:border-slate-200 hover:bg-white hover:shadow-sm dark:hover:border-slate-700 dark:hover:bg-slate-900 sm:gap-3 sm:p-2">
                  <Link href={eventHref(event, locale)} className="h-[76px] w-[76px] shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 sm:h-28 sm:w-28 sm:rounded-2xl">
                    {event.coverImageUrl ? <img src={event.coverImageUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="grid h-full w-full place-items-center bg-gradient-to-br from-cyan-500/50 to-violet-600/50 text-xs font-black">iTicket</div>}
                  </Link>
                  <Link href={eventHref(event, locale)} className="min-w-0 flex-1 py-1">
                    <h2 className="line-clamp-2 text-sm font-black leading-tight text-slate-950 dark:text-white sm:text-lg">{localizedTitle(event, locale)}</h2>
                    <p className={`mt-0.5 text-xs font-semibold sm:text-sm ${soldOut ? "text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-slate-200"}`}>{eventPrice(event, locale)}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 sm:text-xs">{eventDate(event.startsAt, locale)}</p>
                    {!soldOut && <p className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 sm:text-xs"><Sparkles className="h-3 w-3 fill-current" />{isArabic ? "تذاكر متاحة الآن" : "Tickets available"}</p>}
                    {event.venueName && <p className="mt-1 hidden min-w-0 items-center gap-1 truncate text-[11px] text-slate-500 dark:text-slate-400 sm:flex"><MapPin className="h-3 w-3 shrink-0" />{event.venueName}</p>}
                  </Link>
                  <button type="button" onClick={() => toggleSaved(event.id)} aria-label={isSaved ? "Remove from favourites" : "Save event"} className={`mt-0.5 shrink-0 self-start rounded-full p-1.5 transition ${isSaved ? "text-rose-500" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-white"}`}>
                    <Heart className={`h-5 w-5 sm:h-6 sm:w-6 ${isSaved ? "fill-current" : ""}`} />
                  </button>
                </article>
              );
            })}
            {!results.length && <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 sm:col-span-2">{mode === "favorites" ? (isArabic ? "لم تحفظ أي فعالية بعد." : "You have not saved any events yet.") : (isArabic ? "لم نجد فعاليات مطابقة. جرب كلمة بحث أخرى." : "No matching events yet. Try another search.")}</div>}
          </div>
        </section>
      </div>
    </div>
  );
}
