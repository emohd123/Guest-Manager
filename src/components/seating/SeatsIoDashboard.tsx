"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Eye, EyeOff, LayoutGrid, Settings2 } from "lucide-react";
import { SeatsIoChart } from "@/components/seating/SeatsIoChart";
import { trpc } from "@/lib/trpc/client";
import { mergeSeatsIoConfig, readSeatsIoChartKey, readSeatsIoEventKey, seatsIoEventKeyFor } from "@/lib/seatsio";

const WORKSPACE_KEY = process.env.NEXT_PUBLIC_SEATSIO_WORKSPACE_KEY;

export function SeatsIoDashboard({ eventId }: { eventId: string }) {
  const { data: event, isLoading } = trpc.events.get.useQuery({ id: eventId });
  const updateEvent = trpc.events.update.useMutation();
  const [charts, setCharts] = useState<Array<{ key: string; name: string }>>([]);
  const [chartsError, setChartsError] = useState<string | null>(null);
  const [chartKey, setChartKey] = useState<string | null>(null);
  const [eventKey, setEventKey] = useState<string | null>(null);
  const [savingChart, setSavingChart] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => { if (event) { setChartKey(readSeatsIoChartKey(event.settings)); setEventKey(readSeatsIoEventKey(event.settings)); } }, [event]);
  useEffect(() => {
    if (!event || !WORKSPACE_KEY) return;
    let cancelled = false;
    void fetch(`/api/seatsio/charts?eventId=${encodeURIComponent(eventId)}`).then(async (response) => {
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to load charts");
      if (!cancelled) setCharts(Array.isArray(payload.charts) ? payload.charts : []);
    }).catch((error) => { if (!cancelled) setChartsError(error instanceof Error ? error.message : "Unable to load charts"); });
    return () => { cancelled = true; };
  }, [event, eventId]);

  if (isLoading) return <main className="min-h-[70vh] p-8 text-sm font-semibold text-slate-500">Loading event seating…</main>;
  if (!event) return <main className="min-h-[70vh] p-8 text-sm font-semibold text-rose-600">This event could not be found.</main>;
  if (!WORKSPACE_KEY) return <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-950">Seats.io is not configured. Add <code>NEXT_PUBLIC_SEATSIO_WORKSPACE_KEY</code> in Vercel.</div>;

  const publicEventHref = event.companySlug ? `/e/${event.companySlug}/${event.slug}` : null;
  const canOpenPublicPage = event.status === "published" && Boolean(publicEventHref);
  const saveChart = async () => {
    if (!chartKey) return;
    setSavingChart(true);
    setSaveError(null);
    try {
      const response = await fetch(`/api/seatsio/events/${encodeURIComponent(eventId)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chartKey }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Unable to connect this Seats.io chart");
      const nextEventKey = typeof payload.eventKey === "string" ? payload.eventKey : seatsIoEventKeyFor(eventId, chartKey);
      await updateEvent.mutateAsync({ id: eventId, settings: mergeSeatsIoConfig(event.settings, chartKey, nextEventKey) });
      setEventKey(nextEventKey);
    } catch (error) { setSaveError(error instanceof Error ? error.message : "Unable to save chart"); }
    finally { setSavingChart(false); }
  };

  const removeChart = async () => {
    if (!chartKey) return;
    if (!window.confirm("Disable the seating map for customers? Regular tickets will remain available. The Seats.io chart will not be deleted.")) return;
    setSavingChart(true);
    setSaveError(null);
    try {
      await updateEvent.mutateAsync({ id: eventId, settings: mergeSeatsIoConfig(event.settings, null, null) });
      setChartKey(null);
      setEventKey(null);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to disable the seating map");
    } finally {
      setSavingChart(false);
    }
  };

  const mapAttached = Boolean(chartKey && eventKey);

  return <main className="min-h-[70vh] bg-slate-50 p-4 text-slate-950 dark:bg-slate-950 dark:text-white md:p-8"><div className="mx-auto max-w-6xl space-y-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.2em] text-cyan-600">Seats.io seating</p><h1 className="text-3xl font-black">{event.title}</h1><p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-white/60">Attach a Seats.io map when customers should choose seats. Regular ticket purchases remain available independently.</p></div><div className="flex flex-wrap gap-2"><Link href={`/dashboard/events/${eventId}`} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-800 hover:bg-slate-50 dark:border-white/20 dark:bg-slate-900 dark:text-white">Back to event</Link>{canOpenPublicPage && publicEventHref ? <Link href={`${publicEventHref}?openSeats=1`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-cyan-300 bg-cyan-50 px-4 py-3 text-sm font-black text-cyan-900 hover:bg-cyan-100 dark:border-cyan-500/40 dark:bg-cyan-950/40 dark:text-cyan-100">Open customer event <ExternalLink className="h-4 w-4" /></Link> : null}{chartKey ? <Link href={`https://app.seats.io/workspace/${WORKSPACE_KEY}/charts/${chartKey}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-black text-white hover:bg-cyan-700">Open selected chart <ExternalLink className="h-4 w-4" /></Link> : null}</div></div><section className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 dark:border-cyan-500/30 dark:bg-cyan-950/30"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-200">Seating map for this event</p><p className="mt-1 text-sm font-semibold text-slate-700 dark:text-white/70">{mapAttached ? "The Seats.io map is visible on the customer event." : "The Seats.io map is hidden from customers."}</p></div>{mapAttached ? <button type="button" onClick={() => void removeChart()} disabled={savingChart} aria-label="Disable seating map for customers" title="Disable seating map for customers" className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-white px-4 py-2.5 text-sm font-black text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"><EyeOff className="h-4 w-4" />{savingChart ? "Saving…" : "Disable for customers"}</button> : <span className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-500"><Eye className="h-4 w-4" /> Disabled</span>}</div><div className="flex flex-wrap items-end gap-3"><label className="min-w-[280px] flex-1 text-sm font-black text-slate-900 dark:text-white">{mapAttached ? "Change seating map" : "Select seating map"}<select value={chartKey ?? ""} onChange={(e) => setChartKey(e.target.value || null)} className="mt-2 w-full rounded-xl border border-cyan-300 bg-white px-3 py-3 font-semibold text-slate-900 dark:border-cyan-500/40 dark:bg-slate-900 dark:text-white"><option value="">Select a chart…</option>{charts.map((chart) => <option key={chart.key} value={chart.key}>{chart.name} ({chart.key})</option>)}</select></label><button type="button" onClick={() => void saveChart()} disabled={savingChart || !chartKey} className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-black text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50">{savingChart ? "Saving…" : mapAttached ? "Save map changes" : "Enable for customers"}</button></div>{chartsError ? <p className="mt-3 text-sm font-semibold text-rose-700 dark:text-rose-300">{chartsError}. Confirm your Seats.io secret key and refresh.</p> : null}{saveError ? <p className="mt-3 rounded-lg bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-800">{saveError}</p> : null}<p className="mt-3 text-xs text-cyan-900 dark:text-cyan-100">Disabling hides the map from customers without deleting the chart. Normal ticket checkout stays available.</p></section><section className="grid gap-4 md:grid-cols-[1fr_280px]"><div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900"><div className="mb-3 flex items-center gap-2 font-black"><LayoutGrid className="h-5 w-5 text-cyan-500" /> Customer preview</div><p className="mb-4 text-sm text-slate-600 dark:text-white/60">Preview is scoped to <strong>{event.title}</strong>. Click “Choose seats” to open its map.</p><SeatsIoChart eventId={eventId} eventKey={eventKey ?? undefined} workspaceKey={WORKSPACE_KEY} chartKey={chartKey ?? undefined} autoOpen={false} /></div><aside className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900"><Settings2 className="h-6 w-6 text-cyan-500" /><h2 className="mt-3 font-black">How to update</h2><ol className="mt-3 list-decimal space-y-3 pl-5 text-sm text-slate-600 dark:text-white/65"><li>Select the chart you created in Seats.io.</li><li>Save it for this event.</li><li>Edit sections, rows, seats and category prices in Seats.io.</li><li>Refresh the customer event to see changes.</li></ol><p className="mt-5 rounded-xl bg-cyan-50 p-3 text-xs text-cyan-950 dark:bg-cyan-950/40 dark:text-cyan-100">The older native map data remains preserved as a fallback for events without a selected Seats.io chart.</p></aside></section></div></main>;
}
