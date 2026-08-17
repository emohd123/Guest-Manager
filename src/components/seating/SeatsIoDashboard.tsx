"use client";

import Link from "next/link";
import { ExternalLink, LayoutGrid, Settings2 } from "lucide-react";
import { SeatsIoChart } from "@/components/seating/SeatsIoChart";
import { trpc } from "@/lib/trpc/client";

const CHART_KEY = "68f78e07-c80b-5a1a-2f28-a696ec3d4113";
const WORKSPACE_KEY = process.env.NEXT_PUBLIC_SEATSIO_WORKSPACE_KEY;

export function SeatsIoDashboard({ eventId }: { eventId: string }) {
  const { data: event, isLoading } = trpc.events.get.useQuery({ id: eventId });

  if (isLoading) {
    return <main className="min-h-[70vh] p-8 text-sm font-semibold text-slate-500">Loading event seating…</main>;
  }

  if (!event) {
    return <main className="min-h-[70vh] p-8 text-sm font-semibold text-rose-600">This event could not be found.</main>;
  }

  const publicEventHref = event.companySlug ? `/e/${event.companySlug}/${event.slug}` : null;
  const canOpenPublicPage = event.status === "published" && Boolean(publicEventHref);

  if (!WORKSPACE_KEY) return <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-950">Seats.io is not configured. Add <code>NEXT_PUBLIC_SEATSIO_WORKSPACE_KEY</code> in Vercel.</div>;
  return <main className="min-h-[70vh] bg-slate-50 p-4 text-slate-950 dark:bg-slate-950 dark:text-white md:p-8">
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.2em] text-cyan-600">Seats.io seating</p><h1 className="text-3xl font-black">{event.title}</h1><p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-white/60">Manage sections, seats, categories and prices for this event. The customer map uses this event’s chart, never another event’s chart.</p></div><div className="flex flex-wrap gap-2"><Link href={`/dashboard/events/${eventId}`} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-800 hover:bg-slate-50 dark:border-white/20 dark:bg-slate-900 dark:text-white">Back to event</Link>{canOpenPublicPage && publicEventHref ? <Link href={`${publicEventHref}?openSeats=1`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-cyan-300 bg-cyan-50 px-4 py-3 text-sm font-black text-cyan-900 hover:bg-cyan-100 dark:border-cyan-500/40 dark:bg-cyan-950/40 dark:text-cyan-100">Open customer event <ExternalLink className="h-4 w-4" /></Link> : null}<Link href={`https://app.seats.io/workspace/${WORKSPACE_KEY}/charts/${CHART_KEY}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-black text-white hover:bg-cyan-700">Open Seats.io editor <ExternalLink className="h-4 w-4" /></Link></div></div>
      <section className="grid gap-4 md:grid-cols-[1fr_280px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900"><div className="mb-3 flex items-center gap-2 font-black"><LayoutGrid className="h-5 w-5 text-cyan-500" /> Customer preview</div><p className="mb-4 text-sm text-slate-600 dark:text-white/60">Preview is scoped to <strong>{event.title}</strong>. Click “Choose seats” to open its map; this page will not open a chart automatically.</p><SeatsIoChart eventId={eventId} workspaceKey={WORKSPACE_KEY} autoOpen={false} /></div>
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900"><Settings2 className="h-6 w-6 text-cyan-500" /><h2 className="mt-3 font-black">How to update</h2><ol className="mt-3 list-decimal space-y-3 pl-5 text-sm text-slate-600 dark:text-white/65"><li>Open the Seats.io editor.</li><li>Edit sections, rows, seats and category prices.</li><li>Publish the chart in Seats.io.</li><li>Refresh the customer event page to see changes.</li></ol><p className="mt-5 rounded-xl bg-cyan-50 p-3 text-xs text-cyan-950 dark:bg-cyan-950/40 dark:text-cyan-100">This replaces the old iTicket builder. The existing native map data is preserved but is no longer used by this dashboard screen.</p></aside>
      </section>
    </div>
  </main>;
}
