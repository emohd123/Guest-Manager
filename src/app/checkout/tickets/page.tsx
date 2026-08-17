"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, CreditCard, Ticket } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/marketplace";

type CartItem = {
  ticketTypeId: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
};

function parseCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is CartItem =>
      !!item && typeof item === "object" &&
      typeof (item as CartItem).ticketTypeId === "string" &&
      typeof (item as CartItem).quantity === "number" &&
      (item as CartItem).quantity > 0,
    );
  } catch {
    return [];
  }
}

function TicketCheckout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const companySlug = searchParams.get("company") ?? "";
  const eventSlug = searchParams.get("event") ?? "";
  const cartItems = useMemo(() => parseCart(searchParams.get("items")), [searchParams]);
  const selectedSeatIds = (searchParams.get("seats") ?? "").split(",").filter(Boolean);
  const seatHoldToken = searchParams.get("hold") ?? undefined;
  const subtotal = cartItems.reduce((total, item) => total + Number(item.price || 0) * item.quantity, 0);
  const currency = cartItems[0]?.currency ?? "EGP";
  const serviceFee = subtotal > 0 ? subtotal * 0.1 : 0;
  const total = subtotal + serviceFee;
  const totalTickets = cartItems.reduce((count, item) => count + item.quantity, 0);

  const backToEvent = () => {
    if (!companySlug || !eventSlug) return router.push("/");
    router.push(`/e/${companySlug}/${eventSlug}${selectedSeatIds.length ? "?openSeats=1" : ""}#tickets`);
  };

  const submit = async () => {
    if (!companySlug || !eventSlug || !cartItems.length) {
      toast.error("Your ticket selection has expired. Please choose tickets again.");
      return;
    }
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      window.location.assign(`/account/login?redirectTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    setSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json", ...(sessionData.session?.access_token ? { authorization: `Bearer ${sessionData.session.access_token}` } : {}) },
        body: JSON.stringify({ companySlug, eventSlug, cartItems, selectedSeatIds, seatHoldToken }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? "Checkout failed");
      if (result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
        return;
      }
      if (result.success) {
        toast.success("Your free tickets are now in My Tickets.");
        router.replace("/account/tickets");
        return;
      }
      throw new Error("Checkout could not be started.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!cartItems.length) {
    return <main className="min-h-screen bg-zinc-50 px-4 py-24"><div className="mx-auto max-w-xl rounded-3xl border border-zinc-200 bg-white p-7 text-center shadow-sm"><Ticket className="mx-auto h-10 w-10 text-cyan-600" /><h1 className="mt-4 text-2xl font-black">No tickets selected</h1><button onClick={backToEvent} className="mt-5 font-bold text-cyan-700">Back to event</button></div></main>;
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 sm:py-16">
      <section className="mx-auto max-w-xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <button type="button" onClick={backToEvent} className="inline-flex items-center gap-2 text-sm font-black text-cyan-700 hover:text-cyan-900"><ArrowLeft className="h-4 w-4" /> Back to tickets</button>
        <div className="mt-6 flex items-start gap-3"><div className="rounded-2xl bg-cyan-50 p-3 text-cyan-700"><Ticket className="h-6 w-6" /></div><div><p className="text-xs font-black uppercase tracking-[.18em] text-cyan-700">Secure checkout</p><h1 className="mt-1 text-3xl font-black tracking-tight text-zinc-950">Confirm your tickets</h1><p className="mt-2 text-sm text-zinc-600">Review your order before {subtotal > 0 ? "secure payment" : "claiming your free tickets"}.</p></div></div>
        <div className="mt-7 space-y-3 rounded-2xl bg-zinc-50 p-4">
          {cartItems.map((item) => <div key={item.ticketTypeId} className="flex justify-between gap-4 text-sm"><span className="text-zinc-700"><strong>{item.quantity}×</strong> {item.name}</span><strong className="whitespace-nowrap text-zinc-950">{subtotal === 0 ? "FREE" : formatMoney(item.price * item.quantity, item.currency || currency)}</strong></div>)}
          <div className="flex justify-between border-t border-zinc-200 pt-3 text-sm"><span className="text-zinc-600">Tickets ({totalTickets})</span><strong>{subtotal === 0 ? "FREE" : formatMoney(subtotal, currency)}</strong></div>
          {subtotal > 0 && <div className="flex justify-between text-sm"><span className="text-zinc-600">Service fee (10%)</span><strong>{formatMoney(serviceFee, currency)}</strong></div>}
          <div className="flex justify-between border-t border-zinc-200 pt-3 text-lg font-black text-zinc-950"><span>Total</span><span>{total === 0 ? "FREE" : formatMoney(total, currency)}</span></div>
        </div>
        {subtotal === 0 && <p className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"><CheckCircle2 className="h-5 w-5 shrink-0" /> Free tickets are added directly to your account.</p>}
        <button type="button" disabled={submitting} onClick={submit} className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 font-black text-white shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"><CreditCard className="h-5 w-5" />{submitting ? "Processing…" : total === 0 ? "Get free tickets" : "Continue to secure payment"}</button>
      </section>
    </main>
  );
}

export default function TicketCheckoutPage() {
  return <Suspense fallback={<main className="min-h-screen bg-zinc-50" />}><TicketCheckout /></Suspense>;
}
