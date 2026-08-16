"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { QRScannerModal, type ScanResult } from "@/components/checkin/QRScannerModal";

const STAFF_TOKEN_KEY = "iticket_staff_device_token";

type ScanPayload = {
  status: "success" | "revalidated" | "invalid";
  attendeeName: string | null;
  result: string;
  ticketType?: string | null;
};

export default function StaffCheckinPage({ params }: { params: Promise<{ eventId: string }> }) {
  const router = useRouter();
  const [eventId, setEventId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    params.then(({ eventId: id }) => {
      setEventId(id);
      setReady(Boolean(sessionStorage.getItem(STAFF_TOKEN_KEY)));
    });
  }, [params]);

  const scan = useCallback(async (barcode: string): Promise<ScanResult> => {
    const token = sessionStorage.getItem(STAFF_TOKEN_KEY);
    if (!token || !eventId) {
      router.replace("/staff-access");
      return { status: "not_found", barcode };
    }

    const response = await fetch(`/api/mobile/v1/events/${encodeURIComponent(eventId)}/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ barcode, action: "check_in", method: "scan", clientMutationId: crypto.randomUUID() }),
    });
    const payload = (await response.json()) as ScanPayload;
    if (response.status === 401 || response.status === 403) {
      sessionStorage.removeItem(STAFF_TOKEN_KEY);
      router.replace("/staff-access");
    }

    if (payload.status === "success") {
      return { status: "success", attendeeName: payload.attendeeName ?? "Attendee", ticketType: payload.ticketType ?? "Ticket", barcode };
    }
    if (payload.status === "revalidated") {
      return { status: "already_checked_in", attendeeName: payload.attendeeName ?? "Attendee", barcode };
    }
    return { status: "not_found", barcode };
  }, [eventId, router]);

  if (!ready || !eventId) {
    return <main className="flex min-h-screen items-center justify-center bg-black text-white"><Loader2 className="h-8 w-8 animate-spin" /></main>;
  }

  return (
    <main className="min-h-screen bg-black">
      <button type="button" onClick={() => router.replace("/staff-access")} className="fixed left-4 top-4 z-[60] inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur hover:bg-white/20">
        <ArrowLeft className="h-4 w-4" /> Staff access
      </button>
      <QRScannerModal open onClose={() => router.replace("/staff-access")} onScan={scan} />
    </main>
  );
}

