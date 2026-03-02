import Constants from "expo-constants";
import type { MobileGuest, PairingSession, SummaryMetrics } from "../types";

const fallbackBaseUrl = "http://localhost:3000";
const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;
const baseUrl = extra.apiBaseUrl ?? fallbackBaseUrl;

type DeviceInfo = {
  name: string;
  installationId: string;
  platform: string;
  model?: string;
  osVersion?: string;
  appVersion?: string;
};

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const data = (await response.json()) as { error?: string };
      message = data.error ?? message;
    } catch {
      // no-op
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function pairByCodePin(
  accessCode: string,
  pin: string,
  device: DeviceInfo
) {
  return apiRequest<{ token: string; device: { id: string; eventId: string; companyId: string; name: string } }>(
    "/api/mobile/v1/pair/code-pin",
    {
      method: "POST",
      body: JSON.stringify({
        accessCode,
        pin,
        device,
      }),
    }
  );
}

export async function pairByQrToken(qrToken: string, device: DeviceInfo) {
  return apiRequest<{ token: string; device: { id: string; eventId: string; companyId: string; name: string } }>(
    "/api/mobile/v1/pair/qr",
    {
      method: "POST",
      body: JSON.stringify({
        qrToken,
        device,
      }),
    }
  );
}

export async function pairByStaffToken(
  staffToken: string,
  eventId: string,
  device: DeviceInfo
) {
  return apiRequest<{ token: string; device: { id: string; eventId: string; companyId: string; name: string } }>(
    "/api/mobile/v1/pair/staff",
    {
      method: "POST",
      body: JSON.stringify({
        eventId,
        device,
      }),
    },
    staffToken
  );
}

export async function bootstrap(session: PairingSession) {
  return apiRequest<{ summary: SummaryMetrics }>(
    `/api/mobile/v1/events/${session.eventId}/bootstrap`,
    {
      method: "GET",
    },
    session.token
  );
}

export async function fetchGuests(session: PairingSession, updatedSince?: string) {
  const query = updatedSince ? `?updatedSince=${encodeURIComponent(updatedSince)}` : "";
  return apiRequest<{ guests: MobileGuest[]; nextSyncAt: string }>(
    `/api/mobile/v1/events/${session.eventId}/guests${query}`,
    { method: "GET" },
    session.token
  );
}

export async function sendHeartbeat(session: PairingSession, payload: Record<string, unknown>) {
  return apiRequest<{ success: boolean }>(
    "/api/mobile/v1/device/heartbeat",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    session.token
  );
}

export async function scanTicket(
  session: PairingSession,
  payload: {
    barcode: string;
    action?: "check_in" | "checkout";
    method?: "scan" | "search" | "manual" | "walkup";
    clientMutationId?: string;
  }
) {
  return apiRequest<{
    status: "success" | "revalidated" | "invalid";
    result: string;
    ticketId: string | null;
    guestId: string | null;
  }>(
    `/api/mobile/v1/events/${session.eventId}/scan`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    session.token
  );
}

export async function createWalkup(
  session: PairingSession,
  payload: {
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
    checkInNow?: boolean;
    clientMutationId?: string;
  }
) {
  return apiRequest(
    `/api/mobile/v1/events/${session.eventId}/walkups`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    session.token
  );
}

export async function fetchSummary(session: PairingSession) {
  return apiRequest<SummaryMetrics>(
    `/api/mobile/v1/events/${session.eventId}/report/summary`,
    { method: "GET" },
    session.token
  );
}

