import type {
  MobileGuest,
  PairingSession,
  SummaryMetrics,
  DiscoverEvent,
  VisitorEvent,
  VisitorGuestListItem,
  VisitorHomeData,
  VisitorChatThread,
  VisitorMeeting,
  VisitorNetworkingProfile,
  VisitorNetworkingRecommendation,
  VisitorNetworkingRequest,
  VisitorSponsorProfile,
  VisitorSessionItem,
} from "../types";
import { getApiBaseUrl } from "../config";

const baseUrl = getApiBaseUrl();

/** Thrown when the backend rejects the request with 401/403 (expired/invalid token). */
export class UnauthorizedError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "UnauthorizedError";
    this.status = status;
  }
}

// App.tsx registers a handler here so a 401 anywhere (including the background
// heartbeat/replay timers) tears down the session and returns to the auth flow
// instead of silently showing stale data forever.
type UnauthorizedHandler = (status: number) => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}
/** Invoke the registered unauthorized handler (used by the offline replay loop,
 *  which talks to the backend with raw fetch rather than apiRequest). */
export function notifyUnauthorized(status: number) {
  unauthorizedHandler?.(status);
}

type DeviceInfo = {
  name: string;
  installationId: string;
  platform: string;
  model?: string;
  osVersion?: string;
  appVersion?: string;
};

/** Hard cap on any single request. Without it a dead connection on mobile
 *  data never settles and every spinner in the app hangs forever. */
const REQUEST_TIMEOUT_MS = 15_000;

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    });
  } catch (err) {
    const aborted = (err as Error)?.name === "AbortError";
    throw new Error(
      aborted
        ? "Request timed out. Check your connection and try again."
        : "Network error. Check your connection and try again."
    );
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const data = (await response.json()) as { error?: string };
      message = data.error ?? message;
    } catch {
      // no-op
    }
    if (response.status === 401 || response.status === 403) {
      unauthorizedHandler?.(response.status);
      throw new UnauthorizedError(message, response.status);
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

// ── Visitor / Attendee API ────────────────────────────────────────────────────

export async function visitorLogin(email: string, password: string) {
  return apiRequest<{ token: string; userId: string; email: string; name: string }>(
    "/api/mobile/v1/visitor/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }
  );
}

export async function visitorRegister(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  return apiRequest<{ token: string; userId: string; email: string; name: string }>(
    "/api/mobile/v1/visitor/register",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export async function fetchVisitorTicket(token: string) {
  return apiRequest<{
    ticket: import("../types").VisitorTicket | null;
  }>(
    "/api/mobile/v1/visitor/me/ticket",
    { method: "GET" },
    token
  );
}

export async function fetchVisitorEvents(token: string) {
  return apiRequest<{ events: VisitorEvent[] }>(
    "/api/mobile/v1/visitor/me/events",
    { method: "GET" },
    token
  );
}

export async function fetchVisitorNotifications(token: string) {
  return apiRequest<{
    notifications: import("../types").VisitorNotification[];
    unreadCount: number;
  }>(
    "/api/mobile/v1/visitor/me/notifications",
    { method: "GET" },
    token
  );
}

export async function markNotificationsRead(token: string) {
  return apiRequest<{ success: boolean }>(
    "/api/mobile/v1/visitor/me/notifications",
    { method: "POST", body: JSON.stringify({}) },
    token
  );
}

export interface VisitorMessage {
  id: string;
  eventId: string;
  eventName: string | null;
  subject: string | null;
  body: string;
  adminReply: string | null;
  repliedAt: string | null;
  createdAt: string;
}

export async function fetchVisitorMessages(token: string) {
  return apiRequest<{ messages: VisitorMessage[] }>(
    "/api/mobile/v1/visitor/me/messages",
    { method: "GET" },
    token
  );
}

export async function sendVisitorMessage(
  token: string,
  payload: { eventCode: string; subject: string; body: string }
) {
  return apiRequest<{ success: boolean; message: string }>(
    "/api/mobile/v1/visitor/send-message",
    { method: "POST", body: JSON.stringify(payload) },
    token
  );
}

export async function fetchVisitorGuestList(token: string) {
  return apiRequest<{
    guests: VisitorGuestListItem[];
  }>(
    "/api/mobile/v1/visitor/me/guests",
    { method: "GET" },
    token
  );
}

export async function fetchVisitorHome(token: string, eventId?: string) {
  const suffix = eventId ? `?eventId=${encodeURIComponent(eventId)}` : "";
  return apiRequest<VisitorHomeData>(
    `/api/mobile/v1/visitor/me/home${suffix}`,
    { method: "GET" },
    token
  );
}

export async function fetchVisitorSessions(token: string, eventId: string) {
  return apiRequest<{
    sessions: VisitorSessionItem[];
    settings: Record<string, unknown>;
  }>(
    `/api/mobile/v1/visitor/me/sessions?eventId=${encodeURIComponent(eventId)}`,
    { method: "GET" },
    token
  );
}

export async function updateVisitorSessionState(
  token: string,
  eventId: string,
  sessionId: string,
  action: "save" | "unsave" | "plan" | "unplan" | "view" | "live_open"
) {
  return apiRequest<{ success: boolean; state: { savedSessionIds: string[]; plannedSessionIds: string[] } }>(
    `/api/mobile/v1/visitor/me/sessions/${sessionId}`,
    {
      method: "POST",
      body: JSON.stringify({ eventId, action }),
    },
    token
  );
}

export async function fetchVisitorNetworking(token: string, eventId: string) {
  return apiRequest<{
    viewerGuestId: string;
    profile: VisitorNetworkingProfile;
    recommendations: VisitorNetworkingRecommendation[];
    directory: VisitorNetworkingRecommendation[];
    featuredSponsors: VisitorSponsorProfile[];
    requests: VisitorNetworkingRequest[];
    meetings: VisitorMeeting[];
    taxonomy: { interests: string[]; goals: string[]; industries: string[] };
    introText?: string;
    privacyDescription?: string;
    directoryEmptyState?: string;
  }>(
    `/api/mobile/v1/visitor/me/networking?eventId=${encodeURIComponent(eventId)}`,
    { method: "GET" },
    token
  );
}

export async function updateVisitorProfile(
  token: string,
  payload: {
    eventId: string;
    optedIn?: boolean;
    visible?: boolean;
    headline?: string;
    company?: string;
    role?: string;
    bio?: string;
    profileImageUrl?: string;
    interests?: string[];
    goals?: string[];
    industries?: string[];
    availability?: string;
    contactSharing?: { email?: boolean; phone?: boolean };
  }
) {
  return apiRequest<{ profile: VisitorNetworkingProfile }>(
    "/api/mobile/v1/visitor/me/profile",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function sendNetworkingRequest(
  token: string,
  payload: {
    eventId: string;
    targetGuestId: string;
    message?: string;
  }
) {
  return apiRequest<{ request: VisitorNetworkingRequest }>(
    "/api/mobile/v1/visitor/me/networking",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function respondToNetworkingRequest(
  token: string,
  requestId: string,
  payload: {
    eventId: string;
    status: "accepted" | "declined";
    scheduledFor?: string;
    location?: string;
    notes?: string;
  }
) {
  return apiRequest<{ success: boolean }>(
    `/api/mobile/v1/visitor/me/networking/requests/${requestId}/respond`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function fetchVisitorChat(token: string, eventId: string) {
  return apiRequest<{ viewerGuestId: string; threads: VisitorChatThread[] }>(
    `/api/mobile/v1/visitor/me/chat?eventId=${encodeURIComponent(eventId)}`,
    { method: "GET" },
    token
  );
}

export async function sendVisitorChatMessage(
  token: string,
  payload: { eventId: string; body: string; threadId?: string; targetGuestId?: string }
) {
  return apiRequest<{ threadId: string; message: import("../types").VisitorChatMessage }>(
    "/api/mobile/v1/visitor/me/chat",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function registerPushToken(
  token: string,
  payload: { eventId: string; token: string; platform: string }
) {
  return apiRequest<{ success: boolean }>(
    "/api/mobile/v1/visitor/me/push-token",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function confirmVisitorAttendance(token: string, eventId: string) {
  return apiRequest<{
    success: boolean;
    confirmation: {
      guestId: string;
      eventId: string;
      rsvpStatus: string | null;
      rsvpAt: string | null;
      status: string;
    };
  }>(
    `/api/mobile/v1/visitor/me/events/${eventId}/confirm`,
    {
      method: "POST",
      body: JSON.stringify({}),
    },
    token
  );
}

export async function joinEventByCode(token: string, eventCode: string) {
  return apiRequest<{
    event: { id: string; name: string; startsAt: Date; visitorCode: string | null };
    guestFound: boolean;
    message: string;
  }>(
    "/api/mobile/v1/visitor/join-event",
    {
      method: "POST",
      body: JSON.stringify({ eventCode: eventCode.trim().toUpperCase() }),
    },
    token
  );
}

export async function fetchDiscoverEvents() {
  return apiRequest<{ events: DiscoverEvent[] }>(
    "/api/mobile/v1/events/discover",
    { method: "GET" }
  );
}

/** Registers this device for "new event" broadcast pushes (pre-auth Discover). */
export async function registerDiscoverPushToken(payload: {
  token: string;
  platform?: string;
  installationId?: string;
  categories?: string[];
}) {
  return apiRequest<{ success: boolean }>(
    "/api/mobile/v1/discover/push-token",
    { method: "POST", body: JSON.stringify(payload) }
  );
}

export async function createPublicOrder(payload: {
  companySlug: string;
  eventSlug: string;
  attendeeName: string;
  attendeeEmail: string;
  cartItems: Array<{
    ticketTypeId: string;
    name: string;
    price: number;
    currency: string;
    quantity: number;
  }>;
}) {
  return apiRequest<{ success?: boolean; orderId?: string; checkoutUrl?: string; error?: string }>(
    "/api/orders",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}
