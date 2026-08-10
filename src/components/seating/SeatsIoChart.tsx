"use client";
import { useEffect, useRef, useState } from "react";

type Props = { eventId: string; workspaceKey: string; onSelection?: (ids: string[]) => void };
export function SeatsIoChart({ eventId, workspaceKey, onSelection }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [fullScreen, setFullScreen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => {
    let chart: any;
    let cancelled = false;
    const load = async () => {
      await fetch(`/api/seatsio/events/${eventId}`, { method: "POST" });
      if (cancelled || !ref.current) return;
      const render = () => {
        if (!ref.current || !(window as any).seatsio) return;
        chart = new (window as any).seatsio.SeatingChart({
          divId: ref.current.id,
          workspaceKey,
          event: eventId,
          session: "continue",
          onObjectSelected: (obj: any) => setSelected((current) => { const next = current.includes(obj.id || obj.label) ? current : [...current, obj.id || obj.label]; onSelection?.(next); return next; }),
          onObjectDeselected: (obj: any) => setSelected((current) => { const next = current.filter((id) => id !== (obj.id || obj.label)); onSelection?.(next); return next; }),
        }).render();
      };
      if ((window as any).seatsio) render();
      else { const s = document.createElement("script"); s.src = "https://cdn-eu.seatsio.net/chart.js"; s.onload = render; document.head.appendChild(s); }
    };
    void load();
    return () => { cancelled = true; chart?.destroy?.(); };
  }, [eventId, workspaceKey, onSelection]);
  return <>
    <button type="button" onClick={() => setFullScreen(true)} className="mb-3 inline-flex items-center rounded-full bg-cyan-600 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-cyan-700">
      Choose seats
    </button>
    <div className={fullScreen ? "fixed inset-0 z-[200] flex flex-col bg-white" : "w-full"} role={fullScreen ? "dialog" : undefined} aria-modal={fullScreen ? true : undefined} aria-label={fullScreen ? "Choose seats" : "Interactive seating chart"}>
      {fullScreen ? <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <div className="flex items-center gap-3"><button type="button" onClick={() => setFullScreen(false)} aria-label="Back to event" className="rounded-full border border-zinc-300 px-3 py-2 text-lg font-black text-zinc-900">←</button><p className="font-black text-zinc-900">Choose your seats</p></div>
        <button type="button" onClick={() => setFullScreen(false)} className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-bold text-zinc-900">Exit map</button>
      </div> : null}
      <div id={`seatsio-${eventId}`} ref={ref} className={fullScreen ? "min-h-0 flex-1 w-full bg-white" : "min-h-[520px] w-full rounded-2xl bg-white"} />
      {fullScreen ? <div className="flex items-center justify-between gap-4 border-t border-zinc-200 bg-white px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-sm">
        <span className="font-black text-zinc-900">🎟 {selected.length} selected</span>
        <span className="text-zinc-600">Select seats to continue</span>
        <button type="button" disabled={!selected.length} className="rounded-lg bg-zinc-900 px-7 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-40">Next</button>
      </div> : null}
    </div>
  </>;
}
