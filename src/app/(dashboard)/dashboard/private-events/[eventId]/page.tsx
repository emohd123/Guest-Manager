"use client";

import Link from "next/link";
import { use } from "react";
import { ArrowLeft, CalendarDays, ExternalLink, KeyRound, LayoutPanelTop, MessageCircleQuestion, Palette, Settings2, Users } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function PrivateConferenceWorkspace({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const { data: event, isLoading } = trpc.events.get.useQuery({ id: eventId });
  if (isLoading) return <div className="mx-auto max-w-6xl space-y-5"><Skeleton className="h-48" /><Skeleton className="h-80" /></div>;
  if (!event || event.eventType !== "conference") return <div className="mx-auto max-w-xl rounded-3xl border bg-card p-8 text-center"><h1 className="text-xl font-black">Private conference not found</h1><Button className="mt-5" asChild><Link href="/dashboard/private-events">Back to private conferences</Link></Button></div>;
  const tools = [
    { title: "Access & event details", body: "Event title, description, dates, venue and private attendee code.", href: `/dashboard/private-events/${eventId}/settings`, icon: KeyRound },
    { title: "Portal design & speakers", body: "Cover image and reusable speaker profiles displayed in the private portal.", href: `/dashboard/private-events/${eventId}/design`, icon: Palette },
    { title: "Programme & live questions", body: "Sessions, speaker assignment, live-stream links and speaker question access.", href: `/dashboard/private-events/${eventId}/sessions`, icon: CalendarDays },
    { title: "Attendees & QR access", body: "The people who can enter this conference and use their digital access pass.", href: `/dashboard/private-events/${eventId}/guests`, icon: Users },
  ];
  return <div className="mx-auto max-w-6xl space-y-7"><Link href="/dashboard/private-events" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Private conferences</Link><section className="rounded-3xl border border-cyan-500/20 bg-[linear-gradient(120deg,rgba(6,182,212,.14),rgba(99,102,241,.08))] p-7"><p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-500">Private conference workspace</p><h1 className="mt-2 text-3xl font-black tracking-tight">{event.title}</h1><p className="mt-3 max-w-2xl text-muted-foreground">Everything that appears in the private attendee portal is managed from the sections below.</p><div className="mt-5 flex flex-wrap gap-3"><Button asChild><Link href={`/private-event/access/${eventId}`} target="_blank">Preview access page <ExternalLink className="ml-2 h-4 w-4" /></Link></Button><Button variant="outline" asChild><Link href={`/dashboard/private-events/${eventId}/sessions`}><MessageCircleQuestion className="mr-2 h-4 w-4" /> Live questions</Link></Button></div></section><section className="grid gap-4 md:grid-cols-2">{tools.map((tool) => <Link key={tool.title} href={tool.href} className="group rounded-3xl border bg-card p-6 transition hover:-translate-y-0.5 hover:border-cyan-500/40 hover:shadow-lg"><tool.icon className="h-6 w-6 text-cyan-600" /><h2 className="mt-5 text-xl font-black">{tool.title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{tool.body}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-cyan-700 dark:text-cyan-300">Open section <LayoutPanelTop className="h-4 w-4" /></span></Link>)}</section></div>;
}
