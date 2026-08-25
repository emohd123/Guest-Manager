"use client";

import { useCallback, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Camera, Loader2, QrCode } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QRScannerModal, type ScanResult } from "@/components/checkin/QRScannerModal";
import { trpc } from "@/lib/trpc/client";
import { parseTicketQrValue } from "@/lib/ticket-qr";

type DeviceIdentity = { id: string; name: string };

function getDeviceIdentity(): DeviceIdentity {
  if (typeof window === "undefined") return { id: "web-scanner", name: "Web Scanner" };
  const key = "checkin_web_device";
  const existing = window.localStorage.getItem(key);
  if (existing) {
    try {
      return JSON.parse(existing) as DeviceIdentity;
    } catch {
      // Refresh a malformed local device record below.
    }
  }
  const device = { id: `web_${crypto.randomUUID().replace(/-/g, "")}`, name: "Company Web Scanner" };
  window.localStorage.setItem(key, JSON.stringify(device));
  return device;
}

export default function CompanyScannerPage() {
  const [eventId, setEventId] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [device] = useState<DeviceIdentity>(() => getDeviceIdentity());
  const eventsQuery = trpc.events.list.useQuery({ limit: 100, offset: 0 });

  const events = useMemo(() => eventsQuery.data?.events ?? [], [eventsQuery.data?.events]);
  const selectedEvent = events.find((event) => event.id === eventId) ?? null;

  const openScanner = (id: string) => {
    setEventId(id);
    setScannerOpen(true);
  };

  const handleScan = useCallback(async (barcode: string): Promise<ScanResult> => {
    try {
      if (!eventId) return { status: "not_found", barcode };
      const normalizedBarcode = parseTicketQrValue(barcode).ticket;
      if (!normalizedBarcode) return { status: "not_found", barcode };
      const clientMutationId = globalThis.crypto?.randomUUID?.()
        ?? `scan-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const response = await fetch(`/api/checkin/events/${encodeURIComponent(eventId)}/scan`, {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          barcode: normalizedBarcode,
          action: "check_in",
          deviceId: device.id,
          deviceName: device.name,
          clientMutationId,
        }),
      });
      const payload = await response.json().catch(() => null) as ({
        status: "success" | "revalidated" | "invalid";
        result: string;
        attendeeName: string | null;
        expiresAt?: string | null;
        ticketTypeName?: string | null;
      } & { error?: string; requestId?: string }) | null;
      if (!response.ok || !payload?.status) {
        const reference = payload?.requestId ? ` Reference: ${payload.requestId}` : "";
        throw new Error(`${payload?.error ?? `Ticket service returned ${response.status}.`}${reference}`);
      }
      const result = payload;

      if (result.status === "revalidated") {
        return { status: "already_checked_in", attendeeName: result.attendeeName ?? "Guest", barcode: normalizedBarcode };
      }
      if (result.status === "invalid") {
        if (result.result === "expired") return { status: "expired", attendeeName: result.attendeeName ?? "Guest", barcode: normalizedBarcode, expiresAt: result.expiresAt ?? undefined };
        if (result.result === "voided") return { status: "voided", attendeeName: result.attendeeName ?? "Guest", barcode: normalizedBarcode };
        if (result.result === "wrong_event") return { status: "wrong_event", barcode: normalizedBarcode };
        return { status: "not_found", barcode: normalizedBarcode };
      }
      return {
        status: "success",
        attendeeName: result.attendeeName ?? "Guest",
        ticketType: result.ticketTypeName ?? "Ticket",
        barcode: normalizedBarcode,
      };
    } catch (error) {
      console.error("Company ticket scan failed", error);
      return {
        status: "error",
        barcode,
        message: error instanceof Error
          ? `Ticket service error: ${error.message}`
          : "The ticket service is temporarily unavailable. Please retry.",
      };
    }
  }, [device.id, device.name, eventId]);

  if (eventsQuery.isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white"><Loader2 className="h-8 w-8 animate-spin text-cyan-300" /></div>;
  }

  if (eventsQuery.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center text-white">
        <div><p className="text-lg font-semibold">Company scanner access is unavailable.</p><p className="mt-2 text-sm text-white/70">Sign in with a company account that has dashboard access.</p><Button asChild className="mt-6"><Link href="/account">Back to profile</Link></Button></div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain bg-slate-950 px-4 py-8 pb-12 text-white sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white"><Link href="/account"><ArrowLeft className="mr-2 h-4 w-4" />Profile</Link></Button>
          <Badge className="border-cyan-300/30 bg-cyan-300/10 text-cyan-200"><QrCode className="mr-2 h-3.5 w-3.5" />Company scanner</Badge>
        </div>
        <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.06] p-6 sm:p-8">
          <div className="flex items-start gap-4"><span className="rounded-2xl bg-cyan-300/15 p-3 text-cyan-200"><Camera className="h-7 w-7" /></span><div><h1 className="text-3xl font-black">Scan event tickets</h1><p className="mt-2 text-sm leading-6 text-white/65">Choose an event assigned to this company, then scan tickets at the door. Other companies’ events are never shown.</p></div></div>
          {events.length === 0 ? <p className="mt-8 rounded-2xl bg-white/5 p-5 text-sm text-white/70">No assigned events are available for scanning.</p> : <div className="mt-8 grid gap-3">{events.map((event) => <button key={event.id} type="button" onClick={() => openScanner(event.id)} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-left transition hover:border-cyan-300/60 hover:bg-cyan-300/10"><span><span className="block font-bold">{event.title}</span><span className="mt-1 flex items-center gap-2 text-xs text-white/60"><CalendarDays className="h-3.5 w-3.5" />{new Date(event.startsAt).toLocaleString()}</span></span><QrCode className="h-5 w-5 text-cyan-200" /></button>)}</div>}
        </div>
      </div>
      {selectedEvent ? <QRScannerModal open={scannerOpen} onClose={() => { setScannerOpen(false); setEventId(null); }} onScan={handleScan} /> : null}
    </div>
  );
}
