"use client";

import Link from "next/link";
import { CalendarDays, ExternalLink, KeyRound, LayoutPanelTop, Users } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function PrivateEventsDashboardPage() {
  const { data, isLoading } = trpc.events.list.useQuery({ limit: 100 });
  const conferences = (data?.events ?? []).filter((event) => event.eventType === "conference");

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <section className="rounded-3xl border border-cyan-500/20 bg-[linear-gradient(120deg,rgba(6,182,212,.12),rgba(99,102,241,.08))] p-7">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-500">Private event hub</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Private conferences, in one workspace.</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">Manage private access, the attendee portal, speakers, the programme, attendees and live questions here. Conferences are kept out of the normal Events workspace.</p>
        <div className="mt-5 flex flex-wrap gap-3"><Button asChild><Link href="/dashboard/events/new?private=1"><CalendarDays className="mr-2 h-4 w-4" /> Create private conference</Link></Button><Button variant="outline" asChild><Link href="/private-event" target="_blank">Open private event page <ExternalLink className="ml-2 h-4 w-4" /></Link></Button></div>
      </section>

      {isLoading ? <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-52" /><Skeleton className="h-52" /></div> : conferences.length === 0 ? <section className="rounded-3xl border border-dashed p-10 text-center"><KeyRound className="mx-auto h-8 w-8 text-cyan-500" /><h2 className="mt-4 text-xl font-black">No private conferences yet</h2><p className="mt-2 text-sm text-muted-foreground">Create a private conference here to manage its access and attendee portal separately.</p></section> : <section className="grid gap-4 md:grid-cols-2">{conferences.map((event) => <article key={event.id} className="rounded-3xl border bg-card p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-widest text-cyan-500">{event.status}</p><h2 className="mt-2 text-xl font-black">{event.title}</h2><p className="mt-2 text-sm text-muted-foreground">{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.startsAt))}</p></div><span className="rounded-xl bg-cyan-500/10 px-3 py-2 font-mono text-sm font-black text-cyan-600">{event.visitorCode ?? "SET CODE"}</span></div><div className="mt-6 grid gap-2 sm:grid-cols-2"><Button size="sm" asChild><Link href={`/dashboard/private-events/${event.id}`}><LayoutPanelTop className="mr-1.5 h-4 w-4" /> Manage conference</Link></Button><Button size="sm" variant="outline" asChild><Link href={`/dashboard/private-events/${event.id}/guests`}><Users className="mr-1.5 h-4 w-4" /> Attendees</Link></Button></div></article>)}</section>}
    </div>
  );
}
