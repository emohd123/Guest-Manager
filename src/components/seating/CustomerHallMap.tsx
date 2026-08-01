"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Maximize2,
  Minimize2,
  ShoppingCart,
  Ticket,
  X,
} from "lucide-react";
import { getSeatDensity } from "@/components/seating/layout-density";

type CustomerHallMapProps = {
  plan: any;
  selectedSeatIds: string[];
  onChange: (ids: string[]) => void;
  currency: string;
  locale: string;
  eventContext: { title: string; date: string; time: string; location: string };
  startFullScreen?: boolean;
};

function seatPrice(seat: any, row: any, section: any) {
  return seat.price ?? row.price ?? section.price ?? 0;
}

export function CustomerHallMap({
  plan,
  selectedSeatIds,
  onChange,
  currency,
  locale,
  eventContext,
  startFullScreen = false,
}: CustomerHallMapProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const aspect = 16 / 9;
  const [hoveredSeat, setHoveredSeat] = useState<any>(null);
  const [fullScreen, setFullScreen] = useState(startFullScreen);
  const drag = useRef<{
    x: number;
    y: number;
    panX: number;
    panY: number;
  } | null>(null);
  const allSeats = useMemo(
    () =>
      plan.sections.flatMap((section: any) =>
        section.rows.flatMap((row: any) =>
          row.seats.map((seat: any) => ({
            seat,
            row,
            section,
            price: seatPrice(seat, row, section),
            color: seat.color ?? row.color ?? section.color ?? "#22d3ee",
          })),
        ),
      ),
    [plan],
  );
  const selected = allSeats.filter((item: any) =>
    selectedSeatIds.includes(item.seat.id),
  );
  const fittedLayout = useMemo(() => {
    const sections = plan.sections ?? [];
    const labels = plan.metadata?.labels ?? [];
    const hasStage = labels.some((label: any) =>
      String(label.text ?? "").toLowerCase().includes("stage"),
    );
    if (!hasStage || !sections.length) return { sections, labels };

    const top = Math.min(
      ...sections.map(
        (section: any) =>
          Number(section.y ?? 50) - Number(section.height ?? 20) / 2,
      ),
    );
    const bottom = Math.max(
      ...sections.map(
        (section: any) =>
          Number(section.y ?? 50) + Number(section.height ?? 20) / 2,
      ),
    );
    const sourceHeight = Math.max(1, bottom - top);
    const targetTop = 5;
    const targetBottom = 70;
    const scale = Math.min(1, (targetBottom - targetTop) / sourceHeight);
    return {
      sections: sections.map((section: any) => {
        const height = Number(section.height ?? 20) * scale;
        const originalTop =
          Number(section.y ?? 50) - Number(section.height ?? 20) / 2;
        const fittedTop = targetTop + (originalTop - top) * scale;
        return { ...section, y: fittedTop + height / 2, height };
      }),
      labels: labels.map((label: any) =>
        String(label.text ?? "").toLowerCase().includes("stage")
          ? { ...label, x: 50, y: 86, height: 11, width: Math.max(34, label.width ?? 34) }
          : label,
      ),
    };
  }, [plan]);
  const legend = Array.from(
    new Map(
      allSeats.map((item: any) => [`${item.color}-${item.price}`, item]),
    ).values(),
  ).slice(0, 10) as any[];
  const money = (value: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  const toggle = (id: string) =>
    onChange(
      selectedSeatIds.includes(id)
        ? selectedSeatIds.filter((seatId) => seatId !== id)
        : [...selectedSeatIds, id],
    );

  useEffect(() => {
    if (!fullScreen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [fullScreen]);

  return (
    <div className={fullScreen ? "fixed inset-0 z-[200] overflow-y-auto bg-white text-slate-900" : "overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl"}>
      {fullScreen ? (
        <div className="sticky top-0 z-[70] border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-5">
            <div className="flex items-center gap-3 text-lg font-black">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#071017] text-cyan-300"><Ticket className="h-5 w-5" /></span>
              iTicket
            </div>
            <div className="text-xs font-bold text-slate-500">EN / BHD</div>
          </div>
        </div>
      ) : null}
      <div className={fullScreen ? "mx-auto mt-5 flex max-w-[1200px] flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-md" : "flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4"}>
        <div className="flex items-start gap-3">
          <button type="button" onClick={() => fullScreen && setFullScreen(false)} aria-label={fullScreen ? "Close full seat map" : "Event details"} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 hover:bg-slate-200">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="font-black">{eventContext.title}</p>
            <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {eventContext.date} · {eventContext.time}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {eventContext.location}
              </span>
            </div>
          </div>
        </div>
        <div className="relative z-50 flex items-center gap-2">
          <span className="rounded-full bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-800">{selectedSeatIds.length} selected</span>
          <button
            type="button"
            onClick={() => setFullScreen((value) => !value)}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-xs font-black shadow hover:bg-slate-50"
            aria-label={fullScreen ? "Exit full seat map" : "Open full seat map"}
            title={fullScreen ? "Exit full screen" : "Open full map"}
          >
            {fullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            {fullScreen ? "Exit full map" : "Open full map"}
          </button>
        </div>
      </div>
      <div className={fullScreen ? "mx-auto mt-8 max-w-[1500px] px-5 pb-8" : "grid lg:grid-cols-[minmax(0,1fr)_280px]"}>
        <div className="min-w-0">
          <div
            className={fullScreen ? "relative h-[clamp(430px,62vh,720px)] cursor-grab overflow-hidden border border-slate-200 bg-white active:cursor-grabbing" : "relative min-h-[360px] cursor-grab overflow-hidden bg-white active:cursor-grabbing sm:min-h-[520px] lg:min-h-[640px]"}
            onPointerDown={(event) => {
              if ((event.target as HTMLElement).closest("button")) return;
              drag.current = {
                x: event.clientX,
                y: event.clientY,
                panX: pan.x,
                panY: pan.y,
              };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              if (!drag.current) return;
              setPan({
                x: drag.current.panX + event.clientX - drag.current.x,
                y: drag.current.panY + event.clientY - drag.current.y,
              });
            }}
            onPointerUp={() => {
              drag.current = null;
            }}
          >
            <div className="absolute right-4 top-1/2 z-[60] flex -translate-y-1/2 flex-col gap-3">
              <button type="button" onClick={() => setZoom((value) => Math.min(3, value + 0.2))} className="grid h-12 w-12 place-items-center rounded-full border border-slate-200 bg-white text-2xl font-light text-slate-950 shadow-lg hover:bg-slate-50" aria-label="Zoom in seating map" title="Zoom in">+</button>
              <button type="button" onClick={() => setZoom((value) => Math.max(1, value - 0.2))} className="grid h-12 w-12 place-items-center rounded-full border border-slate-200 bg-white text-2xl font-light text-slate-950 shadow-lg hover:bg-slate-50" aria-label="Zoom out seating map" title="Zoom out">−</button>
              <button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="h-9 rounded-full border border-slate-200 bg-white px-3 text-[10px] font-black text-slate-950 shadow-lg hover:bg-slate-50" aria-label="Fit seating map to view" title="Fit map to view">Fit</button>
            </div>
            <div className="absolute inset-0 grid place-items-center p-4">
              <div
                className="relative max-h-full max-w-full origin-center transition-transform duration-100"
                style={{
                  aspectRatio: aspect,
                  width: aspect >= 1 ? "100%" : "auto",
                  height: aspect >= 1 ? "auto" : "100%",
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                }}
              >
                <div className="pointer-events-none absolute inset-0 bg-white" />
                {fittedLayout.labels.map((label: any) => (
                  <div
                    key={label.id}
                    className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-center text-[10px] font-black uppercase tracking-widest text-white"
                    style={{
                      left: `${label.x}%`,
                      top: `${label.y}%`,
                      width: `${label.width}%`,
                      height: `${label.height ?? 10}%`,
                      backgroundColor:
                        label.color === "#ffffff" ? "#64748b" : label.color,
                      color: "#ffffff",
                    }}
                  >
                    {label.text}
                  </div>
                ))}
                {fittedLayout.sections.map((section: any) => {
                  const density = getSeatDensity(section.rows ?? []);
                  return (
                    <div
                      key={section.id}
                      className={fullScreen ? "pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 border border-slate-200 bg-white" : "pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"}
                      style={{
                        left: `${section.x}%`,
                        top: `${section.y}%`,
                        width: `${section.width ?? 30}%`,
                        height: `${section.height ?? 20}%`,
                        containerType: "size",
                        transform: `translate(-50%,-50%) rotate(${section.rotation ?? 0}deg)`,
                      }}
                    >
                    <div
                      className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded bg-black/75 px-2 py-0.5 text-[8px] font-black uppercase"
                      style={{ color: section.color, display: fullScreen ? "none" : undefined }}
                    >
                      {section.name}
                    </div>
                    {section.rows.flatMap((row: any, rowIndex: number) =>
                      row.seats.map((seat: any, seatIndex: number) => {
                        const active = selectedSeatIds.includes(seat.id);
                        const color =
                          seat.color ?? row.color ?? section.color ?? "#22d3ee";
                        const sold = Boolean(seat.sold_ticket_id);
                        const blocked = seat.inventory_status === "blocked";
                        const held =
                          !sold &&
                          (seat.seat_holds ?? []).some(
                            (hold: any) =>
                              hold.status === "pending" &&
                              new Date(hold.expires_at).getTime() > Date.now(),
                          );
                        return (
                          <button
                            type="button"
                            key={seat.id}
                            data-seat-id={seat.id}
                            disabled={seat.unavailable}
                            onMouseEnter={() =>
                              setHoveredSeat({
                                tier: seat.category ?? row.label,
                                section: section.name,
                                row: row.label,
                                seat: seat.label,
                                price: seatPrice(seat, row, section),
                                state: sold
                                  ? "Sold"
                                  : held
                                    ? "Held"
                                    : blocked
                                      ? "Unavailable"
                                      : "Available",
                              })
                            }
                            onMouseLeave={() => setHoveredSeat(null)}
                            onClick={() => toggle(seat.id)}
                            className={`pointer-events-auto absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border transition hover:z-20 hover:scale-[1.8] ${sold ? "cursor-not-allowed border-slate-300 opacity-55" : held ? "cursor-not-allowed border-slate-300 opacity-70" : active ? "z-10 border-slate-900 ring-2 ring-cyan-400" : "border-black/10"}`}
                            style={{
                              width: density.dotSize,
                              height: density.dotSize,
                              left: `${seat.x ?? ((seatIndex + 1) / (row.seats.length + 1)) * 100}%`,
                              top: `${seat.y ?? ((rowIndex + 1) / (section.rows.length + 1)) * 100}%`,
                              backgroundColor:
                                sold || blocked
                                  ? "#e2e8f0"
                                  : held
                                    ? "#cbd5e1"
                                    : active
                                      ? "#ffffff"
                                      : color,
                            }}
                          >
                            <span className="sr-only">Seat {seat.label}</span>
                          </button>
                        );
                      }),
                    )}
                    </div>
                  );
                })}
              </div>
            </div>
            {hoveredSeat ? (
              <div className="pointer-events-none absolute bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs shadow-xl">
                <p className="font-black">
                  {hoveredSeat.tier} · {hoveredSeat.section}
                </p>
                <p className="mt-1 text-slate-500">
                  Row {hoveredSeat.row}, Seat {hoveredSeat.seat} · All ages
                  unless organizer states otherwise
                </p>
                <p className="mt-1 font-black text-cyan-700">
                  {hoveredSeat.state === "Available"
                    ? money(hoveredSeat.price)
                    : hoveredSeat.state}
                </p>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap justify-center gap-2 border-t border-slate-200 p-3">
            {legend.map((item: any) => (
              <div
                key={`${item.color}-${item.price}`}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-600"
              >
                <span
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                {money(item.price)}
              </div>
            ))}
            <div className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-[10px] text-slate-600">
              <span className="h-3 w-3 rounded-full bg-slate-300" />
              Held
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-[10px] text-slate-600">
              <span className="h-3 w-3 rounded-full bg-slate-200" />
              Sold
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-[10px] text-slate-600">
              <span className="h-3 w-3 rounded-full bg-white ring-2 ring-cyan-500" />
              Selected
            </div>
          </div>
        </div>
        <aside className={fullScreen ? "hidden" : "border-t border-slate-200 bg-slate-50 p-4 lg:border-l lg:border-t-0"}>
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-cyan-300" />
            <h5 className="font-black">Your seats</h5>
          </div>
          {selected.length ? (
            <div className="mt-4 space-y-2">
              {selected.map((item: any) => (
                <div
                  key={item.seat.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5"
                >
                  <div>
                    <p className="text-xs font-bold">
                      {item.section.name} · {item.row.label}-{item.seat.label}
                    </p>
                    <p className="mt-1 text-[10px] text-cyan-700">
                      {money(item.price)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(item.seat.id)}
                    className="text-slate-400 hover:text-slate-900"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-xs leading-5 text-slate-500">
              Select seats directly from the map. Your choices are held for 10
              minutes when you continue.
            </p>
          )}
          <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">
            <span className="text-xs text-slate-500">Seat total</span>
            <strong className="text-cyan-700">
              {money(
                selected.reduce(
                  (sum: number, item: any) => sum + item.price,
                  0,
                ),
              )}
            </strong>
          </div>
        </aside>
      </div>
    </div>
  );
}
