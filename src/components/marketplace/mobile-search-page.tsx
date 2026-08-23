"use client";

import Link from "next/link";
import { Heart, MapPin, Search, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { MarketplaceEvent } from "@/types/marketplace";

type Props = {
  initialEvents: MarketplaceEvent[];
  locale: "en" | "ar";
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
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    style: "currency",
    currency: event.currency || "EGP",
    maximumFractionDigits: 0,
  }).format(event.minPrice);
}

export function MobileSearchPage({ initialEvents, locale }: Props) {
  const isArabic = locale === "ar";
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    try {
      setSaved(JSON.parse(localStorage.getItem("events-hub-favorites") ?? "[]") as string[]);
    } catch {
      setSaved([]);
    }
  }, []);

  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return initialEvents;
    return initialEvents.filter((event) => {
      const searchable = [event.title, event.titleAr, event.category, event.venueName, event.locationText, event.companyName]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase();
      return searchable.includes(normalized);
    });
  }, [initialEvents, query]);

  function toggleSaved(id: string) {
    setSaved((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      localStorage.setItem("events-hub-favorites", JSON.stringify(next));
      return next;
    });
  }

  return (
    <main dir={isArabic ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 pb-28 pt-32 text-slate-950 sm:pt-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-5 hidden items-center justify-between sm:flex">
          <Link href={`/?locale=${locale}`} className="text-sm font-bold text-cyan-700 hover:text-cyan-600">{isArabic ? "العودة للرئيسية" : "Back to home"}</Link>
          <span className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">iTicket</span>
        </div>

        <label className="flex h-16 items-center gap-3 rounded-[1.7rem] border border-slate-200 bg-white px-5 shadow-[0_14px_45px_rgba(15,23,42,0.10)] transition focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-100">
          <Search className="h-7 w-7 shrink-0 text-slate-500" />
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={isArabic ? "ابحث عن فعاليات وفنانين وأماكن" : "Find events, artists & venues"}
            className="min-w-0 flex-1 bg-transparent text-xl font-medium text-slate-950 outline-none placeholder:text-slate-400 sm:text-2xl"
          />
          {query ? <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button> : <Sparkles className="h-6 w-6 shrink-0 text-cyan-600" />}
        </label>

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{query ? (isArabic ? "نتائج البحث" : "Search results") : (isArabic ? "الأكثر رواجاً" : "Popular")}</h1>
            <span className="pb-1 text-sm font-semibold text-slate-400">{results.length}</span>
          </div>

          <div className="space-y-4">
            {results.map((event) => {
              const soldOut = !event.hasTickets || event.availableTicketCount <= 0;
              const isSaved = saved.includes(event.id);
              return (
                <article key={event.id} className="group flex gap-3 rounded-2xl p-1.5 transition hover:bg-white hover:shadow-sm">
                  <Link href={eventHref(event, locale)} className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-100 sm:h-32 sm:w-32">
                    {event.coverImageUrl ? <img src={event.coverImageUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="grid h-full w-full place-items-center bg-gradient-to-br from-cyan-500/50 to-violet-600/50 text-xs font-black">iTicket</div>}
                  </Link>
                  <Link href={eventHref(event, locale)} className="min-w-0 flex-1 py-1">
                    <h2 className="line-clamp-2 text-xl font-black leading-tight text-slate-950 sm:text-2xl">{localizedTitle(event, locale)}</h2>
                    <p className={`mt-1 text-lg font-medium ${soldOut ? "text-rose-600" : "text-slate-700"}`}>{eventPrice(event, locale)}</p>
                    <p className="mt-0.5 text-base text-slate-500">{eventDate(event.startsAt, locale)}</p>
                    {!soldOut && <p className="mt-1 flex items-center gap-1 text-sm font-bold text-emerald-600"><Sparkles className="h-4 w-4 fill-current" />{isArabic ? "تذاكر متاحة الآن" : "Tickets available"}</p>}
                    {event.venueName && <p className="mt-1 hidden items-center gap-1 text-xs text-slate-500 sm:flex"><MapPin className="h-3.5 w-3.5" />{event.venueName}</p>}
                  </Link>
                  <button type="button" onClick={() => toggleSaved(event.id)} aria-label={isSaved ? "Remove from favourites" : "Save event"} className={`mt-1 shrink-0 rounded-full p-2 transition ${isSaved ? "text-rose-500" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"}`}>
                    <Heart className={`h-8 w-8 ${isSaved ? "fill-current" : ""}`} />
                  </button>
                </article>
              );
            })}
            {!results.length && <div className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center text-slate-500">{isArabic ? "لم نجد فعاليات مطابقة. جرب كلمة بحث أخرى." : "No matching events yet. Try another search."}</div>}
          </div>
        </section>
      </div>
    </main>
  );
}
