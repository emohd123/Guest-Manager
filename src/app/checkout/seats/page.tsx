"use client";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SeatCheckoutContent() {
  const params = useSearchParams();
  const router = useRouter();
  const seats = (params.get("seats") || "").split(",").filter(Boolean);
  const subtotal = Number(params.get("subtotal") || 0);
  const fee = subtotal * 0.1;
  const currency = params.get("currency") || "EGP";
  return <main className="min-h-screen bg-zinc-50 px-4 py-10"><div className="mx-auto max-w-xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"><button type="button" onClick={() => router.push("/e/demo-events-co/bahrain-comedy-night#tickets")} className="text-sm font-bold text-cyan-700">← Back to seats</button><h1 className="mt-6 text-3xl font-black text-zinc-950">Confirm your tickets</h1><p className="mt-2 text-zinc-600">Review your seats and fees before checkout.</p><div className="mt-6 space-y-3 rounded-2xl bg-zinc-50 p-4"><div className="flex justify-between"><span>Selected seats</span><strong>{seats.length}</strong></div><div className="flex justify-between"><span>Tickets</span><strong>{currency} {subtotal.toFixed(2)}</strong></div><div className="flex justify-between"><span>Service fee (10%)</span><strong>{currency} {fee.toFixed(2)}</strong></div><div className="flex justify-between border-t border-zinc-200 pt-3 text-lg font-black"><span>Total</span><strong>{currency} {(subtotal + fee).toFixed(2)}</strong></div></div><button type="button" className="mt-6 w-full rounded-xl bg-cyan-600 px-5 py-4 font-black text-white">Continue to checkout</button></div></main>;
}
export default function SeatCheckoutPage() { return <Suspense fallback={<main className="min-h-screen bg-zinc-50 p-8" />}><SeatCheckoutContent /></Suspense>; }
