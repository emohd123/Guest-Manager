"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, CreditCard, Ticket } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

function Content() {
  const p = useSearchParams(); const router = useRouter();
  const eventId = p.get("event") || ""; const companySlug = p.get("company") || ""; const eventSlug = p.get("eventSlug") || ""; const returnTo = p.get("returnTo"); const [storedReturnTo, setStoredReturnTo] = useState<string | null>(null); const seats = (p.get("seats") || "").split(",").filter(Boolean);
  useEffect(() => { if (!returnTo) { try { setStoredReturnTo(window.sessionStorage.getItem("iticket.seatReturnTo")); } catch {} } }, [returnTo]);
  const subtotal = Number(p.get("subtotal") || 0); const fee = subtotal > 0 ? subtotal * 0.1 : 0; const total = subtotal + fee; const currency = p.get("currency") || "EGP";
  const [submitting, setSubmitting] = useState(false);
  const submit = async () => {
    if (!eventId || !seats.length) return toast.error("Choose at least one seat.");
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) { window.location.assign(`/account/login?redirectTo=${encodeURIComponent(window.location.pathname + window.location.search)}`); return; }
    const { data: sessionData } = await supabase.auth.getSession();
    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json", ...(sessionData.session?.access_token ? { authorization: `Bearer ${sessionData.session.access_token}` } : {}) }, body: JSON.stringify({ eventId, companySlug, eventSlug, selectedSeatIds: seats }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Checkout failed");
      if (result.checkoutUrl) return window.location.assign(result.checkoutUrl);
      if (result.success) { toast.success("Your tickets are reserved successfully."); router.replace("/account/tickets"); return; }
      throw new Error("Reservation could not be completed.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Checkout failed"); } finally { setSubmitting(false); }
  };
  return <main className="min-h-screen bg-zinc-50 px-4 py-10"><div className="mx-auto max-w-xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
    <button type="button" onClick={() => { const destination = returnTo || storedReturnTo; if (destination?.startsWith("/")) router.replace(destination); else router.back(); }} className="inline-flex items-center gap-2 text-sm font-bold text-cyan-700"><ArrowLeft className="h-4 w-4" /> Back to seats</button>
    <div className="mt-6 flex items-start gap-3"><div className="rounded-2xl bg-cyan-50 p-3 text-cyan-700"><Ticket className="h-6 w-6" /></div><div><p className="text-xs font-black uppercase tracking-[.18em] text-cyan-700">Secure checkout</p><h1 className="mt-1 text-3xl font-black text-zinc-950">Confirm your tickets</h1><p className="mt-2 text-zinc-600">Review your seats before checkout.</p></div></div>
    <div className="mt-6 space-y-3 rounded-2xl bg-zinc-50 p-4"><div className="flex justify-between"><span>Selected seats</span><strong>{seats.length}</strong></div><div className="flex justify-between"><span>Tickets</span><strong>{currency} {subtotal.toFixed(2)}</strong></div>{subtotal > 0 && <div className="flex justify-between"><span>Service fee (10%)</span><strong>{currency} {fee.toFixed(2)}</strong></div>}<div className="flex justify-between border-t border-zinc-200 pt-3 text-lg font-black"><span>Total</span><strong>{total === 0 ? "FREE" : `${currency} ${total.toFixed(2)}`}</strong></div></div>
    {total === 0 && <p className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"><CheckCircle2 className="h-5 w-5 shrink-0" /> Your free tickets will be reserved directly.</p>}
    <button type="button" disabled={submitting || !seats.length} onClick={submit} className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 font-black text-white shadow-lg hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"><CreditCard className="h-5 w-5" />{submitting ? "Processing…" : total === 0 ? "Reserve free tickets" : "Continue to secure payment"}</button>
  </div></main>;
}
export default function Page() { return <Suspense fallback={<main className="min-h-screen bg-zinc-50 p-8" />}><Content /></Suspense>; }
