"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { BrandWordmark } from "@/components/brand/brand-wordmark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STAFF_TOKEN_KEY = "iticket_staff_device_token";
const STAFF_DEVICE_KEY = "iticket_staff_device";

export default function StaffAccessPage() {
  const [accessCode, setAccessCode] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/mobile/v1/pair/code-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessCode: accessCode.trim().toUpperCase(),
          pin: pin.trim(),
          device: {
            name: "iTicket Web Scanner",
            installationId: `web-${crypto.randomUUID()}`,
            platform: "web",
            appVersion: "web-checkin-1",
          },
        }),
      });
      const payload = (await response.json()) as {
        token?: string;
        device?: { id: string; eventId: string; companyId: string; name: string };
        error?: string;
      };

      if (!response.ok || !payload.token || !payload.device) {
        throw new Error(payload.error ?? "Invalid access code or PIN");
      }

      sessionStorage.setItem(STAFF_TOKEN_KEY, payload.token);
      sessionStorage.setItem(STAFF_DEVICE_KEY, JSON.stringify(payload.device));
      window.location.assign(`/staff-checkin/${encodeURIComponent(payload.device.eventId)}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to open staff access");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16 text-slate-900 sm:py-24">
      <section className="mx-auto max-w-md rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl sm:p-9">
        <Link href="/account/login" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Back to buyer login
        </Link>
        <div className="mb-7 flex justify-center">
          <BrandWordmark markClassName="h-11 w-11" textClassName="text-[1.8rem] text-slate-900" />
        </div>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-black">Staff Access</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Open the event-restricted check-in scanner with the access code and PIN from the organiser.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="staff-access-code">Event access code</Label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="staff-access-code"
                value={accessCode}
                onChange={(event) => setAccessCode(event.target.value.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect="off"
                required
                minLength={4}
                maxLength={12}
                placeholder="ABC123"
                className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-10 font-bold tracking-widest text-slate-900"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-pin">PIN</Label>
            <Input
              id="staff-pin"
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              required
              minLength={4}
              maxLength={10}
              placeholder="••••"
              className="h-12 rounded-2xl border-slate-200 bg-slate-50 font-bold tracking-widest text-slate-900"
            />
          </div>
          {error ? <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
          <Button type="submit" disabled={loading} className="h-12 w-full rounded-2xl bg-cyan-600 font-black text-white hover:bg-cyan-700">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening scanner...</> : "Open check-in scanner"}
          </Button>
        </form>
        <p className="mt-6 text-center text-xs leading-5 text-slate-500">This browser session is restricted to the paired event. Use the logout icon in the scanner header to sign out.</p>
      </section>
    </main>
  );
}
