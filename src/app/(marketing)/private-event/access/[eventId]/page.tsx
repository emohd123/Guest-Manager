"use client";

import { FormEvent, use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  KeyRound,
  MapPin,
  ShieldCheck,
  UserRound,
} from "lucide-react";

type Conference = {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
  startsAt: string;
  venueName: string;
  accessConfigured: boolean;
};

function formatConferenceDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date to be confirmed"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "full",
        timeStyle: "short",
      }).format(date);
}

export default function ConferenceAccessPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const [conference, setConference] = useState<Conference | null | undefined>(
    undefined,
  );
  const [accessRole, setAccessRole] = useState<"attendee" | "speaker">(
    "attendee",
  );
  const [username, setUsername] = useState("");
  const [eventCode, setEventCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(
      `/api/private-events/list?eventId=${encodeURIComponent(eventId)}`,
      { signal: controller.signal, cache: "no-store" },
    )
      .then(async (response) =>
        response.ok
          ? ((await response.json()) as { conferences?: Conference[] })
          : { conferences: [] },
      )
      .then((payload) =>
        setConference(
          (payload.conferences ?? []).find((item) => item.id === eventId) ??
            null,
        ),
      )
      .catch(() => setConference(null));
    return () => controller.abort();
  }, [eventId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/private-events/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          eventCode,
          eventId,
          role: accessRole,
        }),
      });
      const payload = (await response.json()) as {
        portalUrl?: string;
        error?: string;
      };
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

  if (conference === undefined)
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-24 dark:bg-[#080b12]">
        <div className="mx-auto h-80 max-w-4xl animate-pulse rounded-[2rem] bg-slate-200 dark:bg-white/10" />
      </main>
    );
  if (conference === null)
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-24 dark:bg-[#080b12]">
        <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-white/10 dark:bg-[#11131a]">
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            Conference unavailable
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            This private conference is not available, or its access has not been
            configured yet.
          </p>
          <Link
            href="/private-event"
            className="mt-6 inline-flex items-center gap-2 text-sm font-black text-cyan-700 dark:text-cyan-300"
          >
            <ArrowLeft className="h-4 w-4" /> Back to conferences
          </Link>
        </div>
      </main>
    );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900 dark:bg-[#080b12] dark:text-white sm:py-20">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/private-event"
          className="mb-5 inline-flex items-center gap-2 text-sm font-black text-slate-700 hover:text-cyan-700 dark:text-slate-200 dark:hover:text-cyan-200"
        >
          <ArrowLeft className="h-4 w-4" /> All private conferences
        </Link>
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#11131a] md:grid md:grid-cols-[0.9fr_1.1fr]">
          <section
            className="relative min-h-72 bg-slate-900 bg-cover bg-center p-7 text-white sm:p-9"
            style={
              conference.coverImageUrl
                ? {
                    backgroundImage: `linear-gradient(160deg, rgba(6,12,21,.42), rgba(3,7,16,.92)), url(${conference.coverImageUrl})`,
                  }
                : undefined
            }
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-300/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-cyan-100">
              <ShieldCheck className="h-4 w-4" /> Private access
            </span>
            <div className="absolute inset-x-7 bottom-8">
              <h1 className="text-3xl font-black leading-tight">
                {conference.title}
              </h1>
              <p className="mt-4 flex items-start gap-2 text-sm text-slate-200">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />{" "}
                {formatConferenceDate(conference.startsAt)}
              </p>
              <p className="mt-2 flex items-start gap-2 text-sm text-slate-200">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />{" "}
                {conference.venueName}
              </p>
            </div>
          </section>
          <section className="p-7 sm:p-9">
            <h2 className="text-2xl font-black">Enter this conference</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Use your assigned name and code for{" "}
              <span className="font-bold text-slate-900 dark:text-white">
                {conference.title}
              </span>
              .
            </p>
            <div className="mt-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-white/5">
              <button
                type="button"
                onClick={() => setAccessRole("attendee")}
                className={`rounded-lg px-3 py-2 text-sm font-black ${accessRole === "attendee" ? "bg-white shadow-sm text-slate-950 dark:bg-[#1d2636] dark:text-white" : "text-slate-500 dark:text-slate-300"}`}
              >
                Attendee
              </button>
              <button
                type="button"
                onClick={() => setAccessRole("speaker")}
                className={`rounded-lg px-3 py-2 text-sm font-black ${accessRole === "speaker" ? "bg-white shadow-sm text-slate-950 dark:bg-[#1d2636] dark:text-white" : "text-slate-500 dark:text-slate-300"}`}
              >
                Speaker
              </button>
            </div>
            <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                  <UserRound className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />{" "}
                  {accessRole === "speaker" ? "Speaker name" : "Attendee name"}
                </span>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder={
                    accessRole === "speaker"
                      ? "Name set in the speaker profile"
                      : "Name on your registration"
                  }
                  autoComplete="name"
                  required
                  minLength={2}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-300/20 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-slate-500"
                />
              </label>
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                  <KeyRound className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />{" "}
                  {accessRole === "speaker"
                    ? "Speaker access code"
                    : "Event access code"}
                </span>
                <input
                  value={eventCode}
                  onChange={(event) =>
                    setEventCode(event.target.value.toUpperCase())
                  }
                  placeholder={
                    accessRole === "speaker"
                      ? "Code supplied for your session"
                      : "e.g. CONF2026"
                  }
                  autoCapitalize="characters"
                  autoComplete="off"
                  required
                  minLength={4}
                  maxLength={10}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 font-mono tracking-[0.18em] text-slate-950 outline-none placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-300/20 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-slate-500"
                />
              </label>
              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-rose-400/30 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:bg-rose-400/10 dark:text-rose-200"
                >
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting || !conference.accessConfigured}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? "Verifying access..."
                  : accessRole === "speaker"
                    ? "Open speaker workspace"
                    : "Open conference"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
            <p className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
              Need a code? Please contact this conference organiser.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
