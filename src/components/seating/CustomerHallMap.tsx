"use client";

import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
  ShoppingCart,
  X,
} from "lucide-react";

type CustomerHallMapProps = {
  plan: any;
  selectedSeatIds: string[];
  onChange: (ids: string[]) => void;
  currency: string;
  locale: string;
  eventContext: { title: string; date: string; time: string; location: string };
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
}: CustomerHallMapProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [aspect, setAspect] = useState(16 / 9);
  const [hoveredSeat, setHoveredSeat] = useState<any>(null);
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

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100">
            <ArrowLeft className="h-4 w-4" />
          </span>
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom((value) => Math.max(1, value - 0.2))}
            className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white shadow"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-12 text-center text-xs font-bold">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((value) => Math.min(3, value + 0.2))}
            className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white shadow"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white shadow"
            title="Reset view"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <div
            className="relative min-h-[360px] cursor-grab overflow-hidden bg-white active:cursor-grabbing sm:min-h-[520px] lg:min-h-[640px]"
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
            <div className="absolute inset-0 grid place-items-center p-4">
              <div
                className="relative w-full origin-center transition-transform duration-100"
                style={{
                  aspectRatio: aspect,
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                }}
              >
                {plan.floor_plan_url ? (
                  <img
                    src={plan.floor_plan_url}
                    alt="Venue floor plan"
                    draggable={false}
                    onLoad={(event) => {
                      const image = event.currentTarget;
                      if (image.naturalWidth && image.naturalHeight)
                        setAspect(image.naturalWidth / image.naturalHeight);
                    }}
                    className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
                  />
                ) : (
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(#e2e8f0_1px,transparent_1px),linear-gradient(90deg,#e2e8f0_1px,transparent_1px)] bg-[size:28px_28px]" />
                )}
                {(plan.metadata?.labels ?? []).map((label: any) => (
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
                {plan.sections.map((section: any) => (
                  <div
                    key={section.id}
                    className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${section.x}%`,
                      top: `${section.y}%`,
                      width: `${section.width ?? 30}%`,
                      height: `${section.height ?? 20}%`,
                      transform: `translate(-50%,-50%) rotate(${section.rotation ?? 0}deg)`,
                    }}
                  >
                    <div
                      className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded bg-black/75 px-2 py-0.5 text-[8px] font-black uppercase"
                      style={{ color: section.color }}
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
                            className={`pointer-events-auto absolute grid h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border transition hover:z-20 hover:scale-[1.8] ${sold ? "cursor-not-allowed border-slate-300 opacity-55" : held ? "cursor-not-allowed border-slate-300 opacity-70" : active ? "z-10 border-slate-900 ring-2 ring-cyan-400" : "border-black/10"}`}
                            style={{
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
                ))}
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
        <aside className="border-t border-slate-200 bg-slate-50 p-4 lg:border-l lg:border-t-0">
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
