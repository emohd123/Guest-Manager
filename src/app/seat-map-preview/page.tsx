"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CustomerHallMap } from "@/components/seating/CustomerHallMap";

const TIERS = [
  { name: "Premium", price: 25, color: "#2563eb", x: 32 },
  { name: "Royal", price: 18, color: "#9333ea", x: 50 },
  { name: "Standard", price: 12, color: "#ef4444", x: 68 },
];

function buildPreviewPlan() {
  return {
    id: "local-preview",
    enabled: true,
    floor_plan_url: "/seat-map-preview.svg",
    metadata: { labels: [] },
    sections: TIERS.map((tier, sectionIndex) => {
      const denseRegression = sectionIndex === 2;
      const rowTotal = denseRegression ? 30 : 7;
      const seatTotal = denseRegression ? 30 : 12;
      return {
      id: `section-${sectionIndex}`,
      name: tier.name,
      price: tier.price,
      color: tier.color,
      x: tier.x,
      y: 42,
      width: 26,
      height: 48,
      rotation: 0,
      rows: Array.from({ length: rowTotal }, (_, rowIndex) => ({
        id: `row-${sectionIndex}-${rowIndex}`,
        label: String.fromCharCode(65 + rowIndex),
        price: null,
        color: null,
        seats: Array.from({ length: seatTotal }, (_, seatIndex) => {
          const unavailable =
            (sectionIndex === 0 && rowIndex === 1 && seatIndex === 5) ||
            (sectionIndex === 1 && rowIndex === 3 && seatIndex === 7) ||
            (sectionIndex === 2 && rowIndex === 28 && seatIndex < 3);
          return {
            id: `preview-${sectionIndex}-${rowIndex}-${seatIndex}`,
            label: String(seatIndex + 1),
            x: ((seatIndex + 1) / (seatTotal + 1)) * 100,
            y: ((rowIndex + 1) / (rowTotal + 1)) * 100,
            price: null,
            color: null,
            category: tier.name,
            inventory_status: unavailable ? "blocked" : "available",
            sold_ticket_id: null,
            seat_holds: [],
            unavailable,
          };
        }),
      })),
      };
    }),
  };
}

export default function SeatMapPreviewPage() {
  const plan = useMemo(() => buildPreviewPlan(), []);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);

  return (
    <main className="min-h-screen bg-[#071017] px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[.2em] text-cyan-300">
              iTicket safe local preview
            </p>
            <h1 className="mt-1 text-3xl font-black">Bahrain Comedy Night</h1>
            <p className="mt-2 text-sm text-slate-400">
              Demonstration inventory only. No holds, orders, or production data are changed.
            </p>
          </div>
          <Link className="rounded-full border border-white/15 px-4 py-2 text-sm font-bold" href="/e/demo-events-co/bahrain-comedy-night">
            Open event page
          </Link>
        </div>
        <CustomerHallMap
          plan={plan}
          selectedSeatIds={selectedSeatIds}
          onChange={setSelectedSeatIds}
          currency="BHD"
          locale="en"
          eventContext={{
            title: "Bahrain Comedy Night — map preview",
            date: "September 25, 2026",
            time: "8:00 PM",
            location: "Demo Events Co, Bahrain",
          }}
          startFullScreen
        />
        <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/[.06] p-4 text-sm text-slate-300">
          Click available dots to update the cart. Hover for section, row, seat and price; drag to pan and use + / − to zoom.
        </div>
      </div>
    </main>
  );
}
