"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Bell, Bookmark, CalendarDays, Download, ExternalLink, FileText, MapPin, QrCode, Users } from "lucide-react";
import type { EventAnnouncement, EventFeatureFlags, EventResource, EventSessionRecord } from "@/types/event";

type PortalEvent = {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string;
  startsAt: string;
  endsAt: string | null;
  venueName: string;
  location: string;
  agendaUrl: string;
  announcements: EventAnnouncement[];
  venueMapUrl: string;
  resources: EventResource[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "full", timeStyle: "short" }).format(new Date(value));
}

function countdown(target: string, now: number) {
  const distance = Math.max(0, new Date(target).getTime() - now);
  const days = Math.floor(distance / 86_400_000);
  const hours = Math.floor((distance % 86_400_000) / 3_600_000);
  const minutes = Math.floor((distance % 3_600_000) / 60_000);
  return { days, hours, minutes };
}

export function ConferencePortalClient({ attendeeName, guestId, event, sessions, features }: {
  attendeeName: string;
  guestId: string;
  event: PortalEvent;
  sessions: EventSessionRecord[];
  features: EventFeatureFlags;
}) {
  const [now, setNow] = useState(() => Date.now());
  const [saved, setSaved] = useState<string[]>([]);
  const [qr, setQr] = useState("");
  const remaining = countdown(event.startsAt, now);
  const sessionDays = useMemo(() => [...new Set(sessions.map((session) => session.startsAt ? new Date(session.startsAt).toDateString() : "Schedule"))], [sessions]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const key = `iticket-saved-sessions-${event.id}-${guestId}`;
    setSaved(JSON.parse(localStorage.getItem(key) ?? "[]") as string[]);
    QRCode.toDataURL(`iticket:guest:${guestId}:event:${event.id}`, { width: 260, margin: 1 }).then(setQr).catch(() => setQr(""));
  }, [event.id, guestId]);

  function toggleSession(id: string) {
    const key = `iticket-saved-sessions-${event.id}-${guestId}`;
    setSaved((current) => {
      const next = current.includes(id) ? current.filter((value) => value !== id) : [...current, id];
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-[#080808] pb-28 text-white">
      <section className="relative isolate overflow-hidden border-b border-white/10">
        {event.coverImageUrl && <img src={event.coverImageUrl} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-30" />}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgba(8,8,8,.96),rgba(8,8,8,.74))]" />
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">Private conference portal</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">{event.title}</h1>
          <p className="mt-4 max-w-2xl text-slate-300">Welcome, {attendeeName}. Your personalised event companion is ready.</p>
          <div className="mt-7 flex flex-wrap gap-3 text-sm font-bold text-slate-100">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-4 py-2"><CalendarDays className="h-4 w-4 text-cyan-300" /> {formatDate(event.startsAt)}</span>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-4 py-2 hover:border-cyan-300"><MapPin className="h-4 w-4 text-cyan-300" /> {event.venueName}</a>
          </div>
          <div className="mt-9 grid max-w-lg grid-cols-3 gap-3">
            {[["Days", remaining.days], ["Hours", remaining.hours], ["Minutes", remaining.minutes]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-center"><strong className="block text-3xl text-cyan-200">{value}</strong><span className="text-xs font-bold uppercase tracking-wider text-slate-300">{label}</span></div>)}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-12 px-5 py-10 sm:px-8">
        <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="rounded-3xl border border-white/10 bg-[#12151e] p-6"><h2 className="text-xl font-black">Conference overview</h2><p className="mt-3 leading-7 text-slate-300">{event.description || "Your organiser will share the latest conference information here."}</p></div>
          <div className="rounded-3xl border border-white/10 bg-[#12151e] p-6"><h2 className="flex items-center gap-2 text-lg font-black"><QrCode className="h-5 w-5 text-cyan-300" /> Digital access pass</h2>{qr ? <img src={qr} alt="Your event check-in QR code" className="mx-auto mt-4 h-44 w-44 rounded-xl bg-white p-2" /> : <p className="mt-4 text-sm text-slate-400">Preparing your QR pass…</p>}<p className="mt-3 text-center text-xs text-slate-400">Show this QR code at registration.</p></div>
        </section>

        {event.announcements.length > 0 && <section><h2 className="flex items-center gap-2 text-2xl font-black"><Bell className="h-6 w-6 text-cyan-300" /> Live announcements</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{event.announcements.map((announcement) => <article key={announcement.id} className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-5"><h3 className="font-black">{announcement.title}</h3><p className="mt-2 text-sm text-slate-200">{announcement.body}</p></article>)}</div></section>}

        <section><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Your agenda</p><h2 className="mt-1 text-3xl font-black">Build your schedule</h2></div><span className="text-sm text-slate-400">{saved.length} saved session{saved.length === 1 ? "" : "s"}</span></div>{sessions.length === 0 ? <p className="mt-5 rounded-2xl border border-white/10 bg-[#12151e] p-6 text-slate-300">The detailed agenda will appear here once it is published by the organiser.</p> : <div className="mt-5 space-y-7">{sessionDays.map((day) => <div key={day}><h3 className="mb-3 font-black text-cyan-200">{day}</h3><div className="space-y-3">{sessions.filter((session) => (session.startsAt ? new Date(session.startsAt).toDateString() : "Schedule") === day).map((session) => <article key={session.id} className="grid gap-4 rounded-2xl border border-white/10 bg-[#12151e] p-5 md:grid-cols-[130px_1fr_auto]"><p className="font-mono text-sm text-cyan-200">{session.startsAt ? new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(session.startsAt)) : "TBA"}<br /><span className="font-sans text-xs text-slate-400">{session.location ?? "Room TBA"}</span></p><div><h4 className="text-lg font-black">{session.title}</h4>{session.description && <p className="mt-1 text-sm text-slate-300">{session.description}</p>}{session.speaker && <p className="mt-3 text-sm font-bold text-cyan-200">{session.speaker}{session.speakerTitle ? ` · ${session.speakerTitle}` : ""}{session.speakerCompany ? `, ${session.speakerCompany}` : ""}</p>}</div><button onClick={() => toggleSession(session.id)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/15 px-3 text-sm font-bold hover:border-cyan-300"> <Bookmark className={`h-4 w-4 ${saved.includes(session.id) ? "fill-cyan-300 text-cyan-300" : ""}`} /> {saved.includes(session.id) ? "Saved" : "Save"}</button></article>)}</div></div>)}</div>}</section>

        <section className="grid gap-5 md:grid-cols-2"><article className="rounded-3xl border border-white/10 bg-[#12151e] p-6"><h2 className="flex items-center gap-2 text-xl font-black"><MapPin className="h-5 w-5 text-cyan-300" /> Venue & navigation</h2><p className="mt-3 text-slate-300">{event.location}</p><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-black text-slate-950">Get directions <ExternalLink className="h-4 w-4" /></a>{event.venueMapUrl && <a href={event.venueMapUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-cyan-200"><MapPin className="h-4 w-4" /> Open floor plan</a>}</article><article className="rounded-3xl border border-white/10 bg-[#12151e] p-6"><h2 className="flex items-center gap-2 text-xl font-black"><FileText className="h-5 w-5 text-cyan-300" /> Resources</h2><p className="mt-3 text-sm text-slate-300">Agenda files, presentations, brochures, and other event documents shared by your organiser.</p><div className="mt-5 space-y-2">{event.agendaUrl && <a href={event.agendaUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-cyan-300/40 px-4 py-3 text-sm font-bold text-cyan-200"><span>Agenda PDF</span><Download className="h-4 w-4" /></a>}{event.resources.map((resource) => <a key={resource.id} href={resource.url} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-sm font-bold hover:border-cyan-300"><span><span className="mr-2 rounded bg-white/10 px-1.5 py-1 text-[10px] text-cyan-200">{resource.fileType ?? "LINK"}</span>{resource.title}</span><Download className="h-4 w-4 text-cyan-300" /></a>)}{!event.agendaUrl && event.resources.length === 0 && <p className="text-sm text-slate-500">No downloadable resources yet.</p>}</div></article></section>

        {(features.networkingEnabled || features.pushNotificationsEnabled) && <section className="rounded-3xl border border-white/10 bg-[linear-gradient(120deg,#13172a,#101116)] p-7"><div className="flex items-start gap-4"><Users className="mt-1 h-6 w-6 shrink-0 text-cyan-300" /><div><h2 className="text-xl font-black">More in the iTicket attendee app</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Opt-in attendee networking, direct messages, live session updates and push notifications are available in the iTicket attendee app for this conference.</p><a href="/event-check-in-app" className="mt-5 inline-flex items-center gap-2 font-black text-cyan-200 hover:text-cyan-100">Open attendee app information <ExternalLink className="h-4 w-4" /></a></div></div></section>}
      </main>
    </div>
  );
}

