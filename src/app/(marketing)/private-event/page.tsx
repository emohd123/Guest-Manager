"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, CalendarDays, KeyRound, ShieldCheck, UserRound } from "lucide-react";

export default function PrivateEventPage() {
  const [username, setUsername] = useState("");
  const [eventCode, setEventCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <div className="min-h-screen bg-[#080808] px-4 py-16 text-white sm:px-6 sm:py-24">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#11131a] shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
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

        <section className="p-8 sm:p-12">
          <h2 className="text-2xl font-black">Enter private event</h2>
          <p className="mt-2 text-sm text-slate-400">Your details are used only to personalize this session on this device.</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-200"><UserRound className="h-4 w-4 text-cyan-300" /> Username</span>
              <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Enter the name on your registration" autoComplete="name" required minLength={2} className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20" />
            </label>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-200"><KeyRound className="h-4 w-4 text-cyan-300" /> Event code</span>
              <input value={eventCode} onChange={(event) => setEventCode(event.target.value.toUpperCase())} placeholder="e.g. CONF2026" autoCapitalize="characters" autoComplete="off" required minLength={4} maxLength={10} className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 font-mono tracking-[0.18em] text-white outline-none placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-500 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20" />
            </label>
            {error && <p role="alert" className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm font-medium text-rose-200">{error}</p>}
            <button type="submit" disabled={isSubmitting} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? "Verifying access..." : "Open conference"}<ArrowRight className="h-4 w-4" />
            </button>
          </form>
          <p className="mt-6 text-center text-xs text-slate-500">Need a code? Please contact your event organizer.</p>
        </section>
      </div>
    </div>
  );
}
