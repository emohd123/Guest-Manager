"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { QRScannerModal, type ScanResult } from "@/components/checkin/QRScannerModal";
import { parseTicketQrValue } from "@/lib/ticket-qr";

const STAFF_TOKEN_KEY = "iticket_staff_device_token";

type ScanPayload = {
  status: "success" | "revalidated" | "invalid";
  attendeeName: string | null;
  result: string;
  ticketType?: string | null;
  expiresAt?: string | null;
};

export default function StaffCheckinPage({ params }: { params: Promise<{ eventId: string }> }) {
  const router = useRouter();
  const [eventId, setEventId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    params.then(({ eventId: id }) => {
      setEventId(id);
      if (!sessionStorage.getItem(STAFF_TOKEN_KEY)) {
        router.replace("/staff-access");
        return;
      }
      setReady(true);
    });
  }, [params, router]);

  const scan = useCallback(async (barcode: string): Promise<ScanResult> => {
    const token = sessionStorage.getItem(STAFF_TOKEN_KEY);
    if (!token || !eventId) {
      router.replace("/staff-access");
      return { status: "not_found", barcode };
    }

    const normalizedBarcode = parseTicketQrValue(barcode).ticket;
    if (!normalizedBarcode) return { status: "not_found", barcode };

    let response: Response;
    try {
      const clientMutationId = globalThis.crypto?.randomUUID?.() ?? `scan-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      response = await fetch(`/api/mobile/v1/events/${encodeURIComponent(eventId)}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ barcode: normalizedBarcode, action: "check_in", method: "scan", clientMutationId }),
      });
    } catch {
      return { status: "error", barcode: normalizedBarcode, message: "The scanner could not connect to the check-in service. Check your internet connection and try again." };
    }

    const rawPayload = await response.text();
    let payload: ScanPayload & { message?: string; error?: string };
    try {
      payload = JSON.parse(rawPayload) as ScanPayload & { message?: string; error?: string };
    } catch {
      return { status: "error", barcode: normalizedBarcode, message: `Check-in service returned an invalid response (${response.status}). Please try again.` };
    }
    if (response.status === 401 || response.status === 403) {
      sessionStorage.removeItem(STAFF_TOKEN_KEY);
      router.replace("/staff-access");
    }

    if (payload.status === "success") {
      return { status: "success", attendeeName: payload.attendeeName ?? "Attendee", ticketType: payload.ticketType ?? "Ticket", barcode: normalizedBarcode };
    }
    if (payload.status === "revalidated") {
      return { status: "already_checked_in", attendeeName: payload.attendeeName ?? "Attendee", barcode: normalizedBarcode };
    }
    if (payload.result === "expired") {
      return {
        status: "expired",
        attendeeName: payload.attendeeName ?? "Attendee",
        barcode: normalizedBarcode,
        expiresAt: payload.expiresAt ?? undefined,
      };
    }
    if (payload.result === "voided") {
      return { status: "voided", attendeeName: payload.attendeeName ?? "Attendee", barcode: normalizedBarcode };
    }
    if (payload.result === "wrong_event") return { status: "wrong_event", barcode: normalizedBarcode };
    if (!response.ok) return { status: "error", barcode: normalizedBarcode, message: payload.message ?? payload.error ?? "Unable to validate this ticket" };
    return { status: "not_found", barcode: normalizedBarcode };
  }, [eventId, router]);

  if (!ready || !eventId) {
    return <main className="flex min-h-screen items-center justify-center bg-black text-white"><Loader2 className="h-8 w-8 animate-spin" /></main>;
  }

  return (
    <main className="min-h-screen bg-black">
      <QRScannerModal open onClose={() => router.replace("/staff-access")} onScan={scan} />
    </main>
  );
}
