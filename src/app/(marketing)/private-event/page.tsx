"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, LockKeyhole, MapPin, ShieldCheck } from "lucide-react";

type PrivateConference = { id: string; title: string; description: string; coverImageUrl: string | null; startsAt: string; venueName: string; accessConfigured: boolean };

function formatConferenceDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date to be confirmed";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function PrivateEventPage() {
  const [conferences, setConferences] = useState<PrivateConference[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/private-events/list", { signal: controller.signal })
      .then(async (response) => response.ok ? (await response.json()) as { conferences?: PrivateConference[] } : { conferences: [] })
      .then((payload) => setConferences(payload.conferences ?? []))
      .catch(() => undefined)
      .finally(() => setIsLoading(false));
    return () => controller.abort();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16 text-slate-900 dark:bg-[#080b12] dark:text-white sm:px-6 sm:py-20">
      <section className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/70 dark:border-white/10 dark:bg-[#11131a] dark:shadow-black/25">
        <div className="relative overflow-hidden bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.25),transparent_37%),linear-gradient(135deg,#13263b,#090c14_66%,#151222)] px-6 py-10 text-white sm:px-10 sm:py-14">
          <div className="absolute -right-20 -top-16 h-64 w-64 rounded-full bg-cyan-300/15 blur-3xl" />
          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-300/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-cyan-100"><ShieldCheck className="h-4 w-4" /> Private conferences</span>
            <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">Your private event space</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-200 sm:text-lg">Choose your conference first. Its access page will securely ask for the attendee name and code supplied by that organiser.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4 dark:border-white/10 sm:px-10">
          <p className="text-sm text-slate-600 dark:text-slate-300"><span className="font-bold text-slate-900 dark:text-white">Private access</span> is kept separate for every conference.</p>
          <span className="rounded-full bg-cyan-50 px-3 py-1.5 text-sm font-bold text-cyan-800 dark:bg-cyan-300/10 dark:text-cyan-100">{conferences.length} available</span>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-6xl">
        <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">Choose a conference</p><h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Available private events</h2></div></div>
        {isLoading ? <div className="mt-6 grid gap-5 md:grid-cols-2"><div className="h-80 animate-pulse rounded-3xl bg-slate-200 dark:bg-white/10" /><div className="h-80 animate-pulse rounded-3xl bg-slate-200 dark:bg-white/10" /></div> : conferences.length > 0 ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {conferences.map((conference) => (
              <article key={conference.id} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60 transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-[#11131a] dark:shadow-black/20">
                <div className="relative h-44 bg-slate-900 bg-cover bg-center" style={conference.coverImageUrl ? { backgroundImage: `linear-gradient(180deg, rgba(8,8,8,0.02), rgba(8,8,8,0.65)), url(${conference.coverImageUrl})` } : undefined}><div className="absolute inset-x-0 bottom-0 p-4"><span className="inline-flex items-center gap-2 rounded-full bg-black/45 px-3 py-1.5 text-xs font-bold text-white backdrop-blur"><LockKeyhole className="h-3.5 w-3.5 text-cyan-200" /> Private event</span></div></div>
                <div className="p-5"><p className="flex items-center gap-2 text-sm font-bold text-cyan-700 dark:text-cyan-200"><CalendarDays className="h-4 w-4" /> {formatConferenceDate(conference.startsAt)}</p><h3 className="mt-3 text-xl font-black leading-tight">{conference.title}</h3><p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-slate-600 dark:text-slate-300">{conference.description}</p><p className="mt-4 flex min-h-5 items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><MapPin className="h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-300" /> <span className="truncate">{conference.venueName}</span></p>{conference.accessConfigured ? <Link href={`/private-event/access/${conference.id}`} className="mt-6 flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 text-sm font-black text-slate-950 transition hover:bg-cyan-200">Open access page <ArrowRight className="h-4 w-4" /></Link> : <p className="mt-6 flex h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-500 dark:border-white/10 dark:text-slate-400">Access code pending</p>}</div>
              </article>
            ))}
          </div>
        ) : <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500 dark:border-white/15 dark:bg-white/[0.03] dark:text-slate-400">No private conferences are available right now.</div>}
      </section>
    </main>
  );
}
