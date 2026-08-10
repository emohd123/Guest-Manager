"use client";
import { useEffect, useRef } from "react";

type Props = { eventId: string; workspaceKey: string; onSelection?: (ids: string[]) => void };
export function SeatsIoChart({ eventId, workspaceKey, onSelection }: Props) {
  const ref = useRef<HTMLDivElement>(null);
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
  return <div id={`seatsio-${eventId}`} ref={ref} className="min-h-[520px] w-full rounded-2xl bg-white" aria-label="Interactive seating chart" />;
}
