"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, CalendarDays, KeyRound, MapPin, ShieldCheck, UserRound } from "lucide-react";

type PrivateConference = {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
  startsAt: string;
  endsAt: string | null;
  timezone: string | null;
  accessConfigured: boolean;
  venueName: string;
};

function formatConferenceDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date to be confirmed";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function PrivateEventPage() {
  const [username, setUsername] = useState("");
  const [eventCode, setEventCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conferences, setConferences] = useState<PrivateConference[]>([]);
  const [selectedConference, setSelectedConference] = useState<string | null>(null);
  const eventCodeInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/private-events/current", { signal: controller.signal })
      .then(async (response) => response.ok ? (await response.json()) as { portalUrl?: string | null } : { portalUrl: null })
      .then((payload) => { if (payload.portalUrl) window.location.replace(payload.portalUrl); })
      .catch(() => undefined);
    void fetch("/api/private-events/list", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return { conferences: [] as PrivateConference[] };
        return (await response.json()) as { conferences?: PrivateConference[] };
      })
      .then((payload) => setConferences(payload.conferences ?? []))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  function startConferenceAccess(conference: PrivateConference) {
    setSelectedConference(conference.title);
    eventCodeInput.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => eventCodeInput.current?.focus(), 300);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/private-events/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, eventCode }),
      });
      const payload = (await response.json()) as { portalUrl?: string; error?: string };

      if (!response.ok || !payload.portalUrl) {
        setError(payload.error ?? "We could not open this private event.");
        return;
      }

      window.location.assign(payload.portalUrl);
    } catch {
      setError("We could not connect right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-20 text-slate-900 dark:bg-[#080b12] dark:text-white sm:px-6 sm:py-24">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#11131a] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.2),_transparent_45%),linear-gradient(145deg,#15182a,#080808)] p-8 sm:p-12 lg:border-b-0 lg:border-r">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
              <ShieldCheck className="h-4 w-4" /> Private access
            </span>
            <h1 className="mt-7 text-4xl font-black tracking-tight sm:text-5xl">Your conference, ready when you are.</h1>
            <p className="mt-5 max-w-md text-base leading-7 text-slate-300">
              Enter the username and event code shared by your organizer to open your private conference portal.
            </p>
            <div className="mt-10 space-y-4 text-sm text-slate-300">
              <p className="flex items-center gap-3"><CalendarDays className="h-5 w-5 text-cyan-300" /> Conference programme, sessions, venue and event information</p>
              <p className="flex items-center gap-3"><KeyRound className="h-5 w-5 text-cyan-300" /> A private code supplied directly by your organizer</p>
            </div>
          </div>
        </section>

        <section className="bg-white p-8 dark:bg-[#11131a] sm:p-12">
          <h2 className="text-2xl font-black">Enter private event</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Your details are used only to personalize this session on this device.</p>
          {selectedConference && <p className="mt-4 rounded-xl border border-cyan-300/40 bg-cyan-50 px-3 py-2 text-sm font-bold text-cyan-800 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-100">Accessing: {selectedConference}</p>}

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200"><UserRound className="h-4 w-4 text-cyan-600 dark:text-cyan-300" /> Username</span>
              <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Enter the name on your registration" autoComplete="name" required minLength={2} className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-300/20 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-slate-500" />
            </label>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200"><KeyRound className="h-4 w-4 text-cyan-600 dark:text-cyan-300" /> Event code</span>
              <input ref={eventCodeInput} value={eventCode} onChange={(event) => setEventCode(event.target.value.toUpperCase())} placeholder="e.g. CONF2026" autoCapitalize="characters" autoComplete="off" required minLength={4} maxLength={10} className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 font-mono tracking-[0.18em] text-slate-950 outline-none placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-300/20 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-slate-500" />
            </label>
            {error && <p role="alert" className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm font-medium text-rose-200">{error}</p>}
            <button type="submit" disabled={isSubmitting} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? "Verifying access..." : "Open conference"}<ArrowRight className="h-4 w-4" />
            </button>
          </form>
          <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">Need a code? Please contact your event organizer.</p>
        </section>
      </div>

      <section className="mx-auto mt-12 max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">Private events</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Available conferences</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">Choose your conference, then enter the attendee name and access code supplied by its organiser.</p>
          </div>
          <span className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-700 dark:border-white/10 dark:text-slate-300">{conferences.length} conference{conferences.length === 1 ? "" : "s"}</span>
        </div>

        {conferences.length > 0 ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {conferences.map((conference) => (
              <article key={conference.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 dark:border-white/10 dark:bg-[#11131a] dark:shadow-black/20">
                <div className="h-44 bg-slate-900 bg-cover bg-center" style={conference.coverImageUrl ? { backgroundImage: `linear-gradient(180deg, rgba(8,8,8,0.04), rgba(8,8,8,0.55)), url(${conference.coverImageUrl})` } : undefined} />
                <div className="p-6">
                  <p className="flex items-center gap-2 text-sm font-bold text-cyan-700 dark:text-cyan-200"><CalendarDays className="h-4 w-4" /> {formatConferenceDate(conference.startsAt)}</p>
                  <h3 className="mt-3 text-xl font-black">{conference.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{conference.description}</p>
                  <p className="mt-4 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><MapPin className="h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-300" /> {conference.venueName}</p>
                  {conference.accessConfigured ? (
                    <button type="button" onClick={() => startConferenceAccess(conference)} className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 text-sm font-black text-slate-950 transition hover:bg-cyan-200">Enter with access code <ArrowRight className="h-4 w-4" /></button>
                  ) : (
                    <p className="mt-6 inline-flex h-11 items-center rounded-xl border border-white/10 px-4 text-sm font-bold text-slate-400">Access code pending from organiser</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-10 text-center text-sm text-slate-400">No private conferences are available right now.</div>
        )}
      </section>
    </div>
  );
}
