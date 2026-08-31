import crypto from "crypto";

type PrivateEventAccess = {
  eventId: string;
  guestId: string;
  username: string;
  role?: "attendee" | "speaker";
  speakerName?: string;
  expiresAt: number;
};

const COOKIE_NAME = "iticket_private_event_access";
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 12;

function signingKey() {
  const key = process.env.PRIVATE_EVENT_ACCESS_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Private event access is not configured.");
  return key;
}

function signature(value: string) {
  return crypto.createHmac("sha256", signingKey()).update(value).digest("base64url");
}

export function createPrivateEventAccess(input: Omit<PrivateEventAccess, "expiresAt">, eventEndsAt?: string | null) {
  const endTime = eventEndsAt ? new Date(eventEndsAt).getTime() : Number.NaN;
  const expiresAt = Number.isFinite(endTime) && endTime > Date.now()
    ? endTime
    : Date.now() + DEFAULT_MAX_AGE_SECONDS * 1000;
  const payload: PrivateEventAccess = { ...input, expiresAt };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return { token: `${encoded}.${signature(encoded)}`, maxAge: Math.max(60, Math.floor((expiresAt - Date.now()) / 1000)) };
}

export function readPrivateEventAccess(token?: string): PrivateEventAccess | null {
  if (!token) return null;
  const [encoded, receivedSignature, ...rest] = token.split(".");
  if (!encoded || !receivedSignature || rest.length) return null;

  const expectedSignature = signature(encoded);
  if (receivedSignature.length !== expectedSignature.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(receivedSignature), Buffer.from(expectedSignature))) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as PrivateEventAccess;
    if (!payload.eventId || !payload.guestId || !payload.username || payload.expiresAt <= Date.now()) return null;
    if (payload.role && payload.role !== "attendee" && payload.role !== "speaker") return null;
    return payload;
  } catch {
    return null;
  }
}

export const privateEventAccessCookie = {
  name: COOKIE_NAME,
  options: {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DEFAULT_MAX_AGE_SECONDS,
  },
};
