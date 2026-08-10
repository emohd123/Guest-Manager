"use client";
import { useEffect, useRef, useState } from "react";

type Props = { eventId: string; workspaceKey: string; onSelection?: (ids: string[]) => void };
export function SeatsIoChart({ eventId, workspaceKey, onSelection }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [fullScreen, setFullScreen] = useState(false);
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
          onObjectSelected: (obj: any) => onSelection?.((chart?.selectedObjects || []).map((x: any) => x.id || x.label)),
          onObjectDeselected: (obj: any) => onSelection?.((chart?.selectedObjects || []).map((x: any) => x.id || x.label)),
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
    <div className={fullScreen ? "fixed inset-0 z-[100] flex flex-col bg-white" : "w-full"} role={fullScreen ? "dialog" : undefined} aria-modal={fullScreen ? true : undefined} aria-label={fullScreen ? "Choose seats" : "Interactive seating chart"}>
      {fullScreen ? <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <p className="font-black text-zinc-900">Choose your seats</p>
        <button type="button" onClick={() => setFullScreen(false)} className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-bold text-zinc-900">Exit map</button>
      </div> : null}
      <div id={`seatsio-${eventId}`} ref={ref} className={fullScreen ? "min-h-0 flex-1 w-full bg-white" : "min-h-[520px] w-full rounded-2xl bg-white"} />
    </div>
  </>;
}
