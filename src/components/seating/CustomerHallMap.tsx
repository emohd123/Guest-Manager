"use client";

import { useMemo, useRef, useState } from "react";
import { Minus, Plus, RotateCcw, ShoppingCart, X } from "lucide-react";

type CustomerHallMapProps = {
  plan: any;
  selectedSeatIds: string[];
  onChange: (ids: string[]) => void;
  currency: string;
  locale: string;
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
}: CustomerHallMapProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [aspect, setAspect] = useState(16 / 9);
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
    <div className="overflow-hidden rounded-3xl border border-cyan-300/25 bg-[#06111a] text-white shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300">
            Interactive hall map
          </p>
          <p className="mt-1 text-xs text-white/50">
            Drag to pan, zoom, then choose individual seats.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom((value) => Math.max(1, value - 0.2))}
            className="grid h-9 w-9 place-items-center rounded-lg bg-white/10"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-12 text-center text-xs font-bold">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((value) => Math.min(3, value + 0.2))}
            className="grid h-9 w-9 place-items-center rounded-lg bg-white/10"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="grid h-9 w-9 place-items-center rounded-lg bg-white/10"
            title="Reset view"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <div
            className="relative max-h-[650px] min-h-[420px] cursor-grab overflow-hidden bg-[#0a1721] active:cursor-grabbing"
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
                {(plan.metadata?.labels ?? []).map((label: any) => (
                  <div
                    key={label.id}
                    className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-md border border-white/30 bg-black/65 px-3 py-1 text-center text-[10px] font-black uppercase tracking-widest"
                    style={{
                      left: `${label.x}%`,
                      top: `${label.y}%`,
                      width: `${label.width}%`,
                      color: label.color,
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
                            disabled={seat.unavailable}
                            onClick={() => toggle(seat.id)}
                            title={`${section.name}, Row ${row.label}, Seat ${seat.label} · ${sold ? "Sold" : held ? "Held" : money(seatPrice(seat, row, section))}`}
                            className={`pointer-events-auto absolute grid h-3 w-3 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-t-md border transition hover:z-20 hover:scale-[1.8] ${sold ? "cursor-not-allowed border-slate-600 opacity-45" : held ? "cursor-not-allowed border-amber-300 opacity-70" : active ? "z-10 border-white ring-2 ring-white" : "border-black/30"}`}
                            style={{
                              left: `${seat.x ?? ((seatIndex + 1) / (row.seats.length + 1)) * 100}%`,
                              top: `${seat.y ?? ((rowIndex + 1) / (section.rows.length + 1)) * 100}%`,
                              backgroundColor: sold
                                ? "#334155"
                                : held
                                  ? "#f59e0b"
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
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-white/10 p-3">
            {legend.map((item: any) => (
              <div
                key={`${item.color}-${item.price}`}
                className="flex items-center gap-1.5 text-[10px] text-white/65"
              >
                <span
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                {money(item.price)}
              </div>
            ))}
            <div className="flex items-center gap-1.5 text-[10px] text-white/65">
              <span className="h-3 w-3 rounded-sm bg-amber-500" />
              Held
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-white/65">
              <span className="h-3 w-3 rounded-sm bg-slate-700" />
              Sold
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-white/65">
              <span className="h-3 w-3 rounded-sm bg-white ring-1 ring-cyan-300" />
              Selected
            </div>
          </div>
        </div>
        <aside className="border-t border-white/10 bg-white/[.035] p-4 lg:border-l lg:border-t-0">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-cyan-300" />
            <h5 className="font-black">Your seats</h5>
          </div>
          {selected.length ? (
            <div className="mt-4 space-y-2">
              {selected.map((item: any) => (
                <div
                  key={item.seat.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-black/15 p-2.5"
                >
                  <div>
                    <p className="text-xs font-bold">
                      {item.section.name} · {item.row.label}-{item.seat.label}
                    </p>
                    <p className="mt-1 text-[10px] text-cyan-200">
                      {money(item.price)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(item.seat.id)}
                    className="text-white/40 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-xs leading-5 text-white/40">
              Select seats directly from the map. Your choices are held for 10
              minutes when you continue.
            </p>
          )}
          <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-xs text-white/50">Seat total</span>
            <strong className="text-cyan-200">
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
