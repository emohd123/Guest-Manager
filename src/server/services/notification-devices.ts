import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { sendExpoPush } from "./expo-push";

export const notificationDeviceCookie = "iticket_notification_device";
export const hashDeviceSecret = (secret: string) =>
  crypto.createHash("sha256").update(secret).digest("hex");
function signature(id: string) {
  const key =
    process.env.PRIVATE_EVENT_ACCESS_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Notification registration is not configured.");
  return crypto
    .createHmac("sha256", key)
    .update(`push-device:${id}`)
    .digest("hex");
}
export function signDeviceCookie(id: string) {
  return `${id}.${signature(id)}`;
}
export function verifiedCookieDevice(request: NextRequest) {
  const [id, received, ...extra] = (
    request.cookies.get(notificationDeviceCookie)?.value ?? ""
  ).split(".");
  if (!id || !received || extra.length || !/^[a-f0-9]{64}$/.test(received))
    return null;
  return crypto.timingSafeEqual(
    Buffer.from(received),
    Buffer.from(signature(id)),
  )
    ? id
    : null;
}
export async function clearNotificationIdentity(
  request: NextRequest,
  scope: "all" | "account" | "conference",
  proof?: { id: string; secret: string },
) {
  const cookieId = request.headers?.get("x-iticket-native") === "1" ? null : verifiedCookieDevice(request);
  const id = cookieId ?? proof?.id;
  if (!id) return;
  const admin = createSupabaseAdminClient();
  const changes =
    scope === "account"
      ? { user_id: null, recipient_email: null }
      : scope === "conference"
        ? {
            conference_event_id: null,
            conference_role: null,
            conference_expires_at: null,
          }
        : {
            enabled: false,
            user_id: null,
            recipient_email: null,
            conference_event_id: null,
            conference_role: null,
            conference_expires_at: null,
          };
  let query = admin.from("notification_devices").update(changes).eq("id", id);
  if (!cookieId && proof)
    query = query.eq("secret_hash", hashDeviceSecret(proof.secret));
  const { error } = await query;
  if (error)
    throw new Error("Could not update this phone’s notification settings.");
}

type Device = {
  id: string;
  token: string;
  recipient_email: string | null;
  conference_event_id: string | null;
  conference_role: string | null;
  conference_expires_at: string | null;
  event_updates: boolean;
};
export async function pushEventNotification(input: {
  eventId: string;
  title: string;
  body: string;
  type: string;
  emails: string[];
  recipientOnly?: boolean;
  audience?: "speaker" | "attendee";
}) {
  const admin = createSupabaseAdminClient();
  const { data: event, error: eventError } = await admin
    .from("events")
    .select("id,status,event_type,ends_at,settings")
    .eq("id", input.eventId)
    .is("deleted_at", null)
    .maybeSingle();
  if (eventError)
    throw new Error("Event notification settings could not be loaded.");
  if (
    !event ||
    (!input.recipientOnly && event.status !== "published") ||
    event.settings?.eventApp?.features?.pushNotificationsEnabled === false ||
    (!input.recipientOnly &&
      event.event_type === "conference" &&
      event.ends_at &&
      Date.parse(event.ends_at) <= Date.now())
  )
    return { accepted: 0, failed: 0 };
  const emails = new Set(
    input.emails.map((email) => email.trim().toLowerCase()),
  );
  const columns =
    "id,token,recipient_email,conference_event_id,conference_role,conference_expires_at,event_updates";
  const fresh = new Date(Date.now() - 90 * 86400000).toISOString();
  const selected: Device[] = [];
  const emailList = [...emails];
  if (!input.audience)
    for (let offset = 0; offset < emailList.length; offset += 100) {
      const { data, error } = await admin
        .from("notification_devices")
        .select(columns)
        .eq("enabled", true)
        .eq("event_updates", true)
        .gt("updated_at", fresh)
        .in("recipient_email", emailList.slice(offset, offset + 100));
      if (error)
        throw new Error("Notification destinations could not be loaded.");
      selected.push(...((data ?? []) as Device[]));
    }
  if (!input.recipientOnly) {
    const { data, error } = await admin
      .from("notification_devices")
      .select(columns)
      .eq("enabled", true)
      .eq("event_updates", true)
      .gt("updated_at", fresh)
      .eq("conference_event_id", input.eventId)
      .gt("conference_expires_at", new Date().toISOString());
    if (error) throw new Error("Conference destinations could not be loaded.");
    selected.push(...((data ?? []) as Device[]));
  }
  const devices = selected.filter((device) => {
    const conference =
      device.conference_event_id === input.eventId &&
      Date.parse(device.conference_expires_at ?? "") > Date.now();
    if (input.audience)
      return conference && device.conference_role === input.audience;
    return (
      (device.recipient_email &&
        emails.has(device.recipient_email.toLowerCase())) ||
      (!input.recipientOnly && conference)
    );
  });
  const result = await sendExpoPush(
    devices.map((device) => ({
      to: device.token,
      title: input.title,
      body: input.body,
      data: {
        eventId: input.eventId,
        type: input.type,
        url:
          device.conference_event_id === input.eventId && !input.recipientOnly
            ? `/private-event/access/${input.eventId}`
            : "/account/notifications#notifications",
      },
    })),
  );
  if (result.invalidTokens.length) {
    await admin
      .from("notification_devices")
      .update({ enabled: false })
      .in("token", result.invalidTokens);
  }
  return { accepted: result.accepted, failed: result.failed };
}
