"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TicketRow } from "../page";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/account/summary")
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error ?? "Sign in to view your tickets.");
        setTickets(data.tickets ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load tickets."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-white px-4 py-28 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link href="/account" className="inline-flex items-center gap-2 text-sm font-black text-cyan-700"><ArrowLeft className="h-4 w-4" /> Back to account</Link>
        <div className="mt-6 flex items-center gap-3"><Ticket className="h-7 w-7 text-cyan-600" /><div><p className="text-xs font-black uppercase tracking-[.24em] text-cyan-600">Buyer account</p><h1 className="text-4xl font-black">My tickets</h1></div></div>
        {loading ? <p className="mt-8 text-slate-500">Loading your tickets…</p> : error ? <div className="mt-8"><p className="text-slate-600">{error}</p><Button asChild className="mt-5 rounded-full bg-slate-950 text-white"><Link href="/account/login">Sign in</Link></Button></div> : tickets.length ? <div className="mt-8 space-y-5">{tickets.map((ticket) => <TicketRow key={ticket.id} ticket={ticket} />)}</div> : <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">No tickets are linked to this account yet.</div>}
      </div>
    </main>
  );
}
