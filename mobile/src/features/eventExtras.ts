import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import type { DiscoverEvent } from "../types";
import { getApiBaseUrl } from "../config";

// Extra per-event features for the public Discover experience:
// favorites (Saved tab), event reminders (scheduled local notifications),
// add-to-calendar deep link, share text, and new-event detection.

const SAVED_KEY = "events_hub_saved_event_ids";
const REMINDERS_KEY = "events_hub_event_reminders";
const SEEN_KEY = "events_hub_seen_event_ids";
const CHANNEL_ID = "events";

/** eventId -> scheduled notification ids */
export type ReminderMap = Record<string, string[]>;

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// ── Favorites ────────────────────────────────────────────────────────────────
export async function getSavedIds(): Promise<string[]> {
  return readJson<string[]>(SAVED_KEY, []);
}

export async function toggleSaved(eventId: string): Promise<string[]> {
  const current = await getSavedIds();
  const next = current.includes(eventId)
    ? current.filter((id) => id !== eventId)
    : [...current, eventId];
  await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(next));
  return next;
}

// ── Reminders ────────────────────────────────────────────────────────────────
async function ensureNotificationChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Event alerts",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
  });
}

export async function getReminders(): Promise<ReminderMap> {
  return readJson<ReminderMap>(REMINDERS_KEY, {});
}

/**
 * Schedules reminders 24h and 1h before the event (whichever are still in the
 * future). Returns a human message describing what was scheduled.
 */
export async function scheduleEventReminder(
  event: DiscoverEvent
): Promise<{ ok: boolean; message: string }> {
  const start = new Date(event.startsAt).getTime();
  if (Number.isNaN(start)) return { ok: false, message: "This event has no valid start time." };

  const now = Date.now();
  const slots: { date: Date; label: string; body: string }[] = [];
  const dayBefore = start - 24 * 60 * 60 * 1000;
  const hourBefore = start - 60 * 60 * 1000;
  if (dayBefore > now) {
    slots.push({ date: new Date(dayBefore), label: "1 day before", body: "Starts tomorrow" });
  }
  if (hourBefore > now) {
    slots.push({ date: new Date(hourBefore), label: "1 hour before", body: "Starts in 1 hour" });
  }
  if (slots.length === 0) {
    return { ok: false, message: "This event starts too soon to schedule a reminder." };
  }

  const permission = await Notifications.requestPermissionsAsync();
  if (permission.status !== "granted") {
    return { ok: false, message: "Notifications are disabled — enable them in system settings to get reminders." };
  }
  await ensureNotificationChannel();

  const where = event.venueName ?? event.locationText ?? event.companyName;
  const ids: string[] = [];
  for (const slot of slots) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Reminder: ${event.title}`,
        body: `${slot.body}${where ? ` · ${where}` : ""}`,
        data: { eventId: event.id, url: event.publicUrl },
        sound: "default",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: slot.date,
        channelId: CHANNEL_ID,
      },
    });
    ids.push(id);
  }

  const reminders = await getReminders();
  reminders[event.id] = ids;
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  return { ok: true, message: `Reminder set — we'll notify you ${slots.map((s) => s.label).join(" and ")}.` };
}

export async function cancelEventReminder(eventId: string): Promise<void> {
  const reminders = await getReminders();
  const ids = reminders[eventId] ?? [];
  await Promise.all(
    ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined))
  );
  delete reminders[eventId];
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
}

// ── Add to calendar / share ──────────────────────────────────────────────────
function toCalendarStamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Google Calendar "create event" template URL — no native calendar permission needed. */
export function buildCalendarUrl(event: DiscoverEvent): string {
  const start = toCalendarStamp(event.startsAt);
  const end = event.endsAt
    ? toCalendarStamp(event.endsAt)
    : toCalendarStamp(new Date(new Date(event.startsAt).getTime() + 2 * 60 * 60 * 1000).toISOString());
  const location = event.venueName ?? event.locationText ?? "";
  const details = [event.shortDescription, eventPublicLink(event)].filter(Boolean).join("\n\n");
  const params = [
    "action=TEMPLATE",
    `text=${encodeURIComponent(event.title)}`,
    `dates=${start}/${end}`,
    `details=${encodeURIComponent(details)}`,
    `location=${encodeURIComponent(location)}`,
  ].join("&");
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function eventPublicLink(event: DiscoverEvent): string {
  return event.publicUrl.startsWith("http") ? event.publicUrl : `${getApiBaseUrl()}${event.publicUrl}`;
}

/** "In 3 days" / "In 5 hours" / "Live now" chip label. */
export function countdownLabel(startsAt: string, endsAt?: string | null): string | null {
  const start = new Date(startsAt).getTime();
  if (Number.isNaN(start)) return null;
  const now = Date.now();
  const end = endsAt ? new Date(endsAt).getTime() : start + 4 * 60 * 60 * 1000;
  if (now >= start && now <= end) return "Live now";
  if (now > end) return "Ended";
  const diff = start - now;
  const minutes = Math.round(diff / 60_000);
  if (minutes < 60) return `In ${minutes} min`;
  const hours = Math.round(diff / 3_600_000);
  if (hours < 48) return `In ${hours} hours`;
  return `In ${Math.round(diff / 86_400_000)} days`;
}

// ── New-event detection ──────────────────────────────────────────────────────
/**
 * Compares the current feed against the ids seen on the previous visit.
 * First run just seeds storage (no false "everything is new" blast).
 */
export async function detectNewEvents(events: DiscoverEvent[]): Promise<string[]> {
  const currentIds = events.map((e) => e.id);
  const raw = await AsyncStorage.getItem(SEEN_KEY);
  await AsyncStorage.setItem(SEEN_KEY, JSON.stringify(currentIds));
  if (!raw) return [];
  let seen: string[] = [];
  try {
    seen = JSON.parse(raw) as string[];
  } catch {
    return [];
  }
  return currentIds.filter((id) => !seen.includes(id));
}

/** Fires an immediate local notification about new events — only if permission is already granted. */
export async function notifyNewEvents(events: DiscoverEvent[]): Promise<void> {
  if (events.length === 0) return;
  try {
    const permission = await Notifications.getPermissionsAsync();
    if (permission.status !== "granted") return;
    await ensureNotificationChannel();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: events.length === 1 ? "New event in Bahrain 🎉" : `${events.length} new events in Bahrain 🎉`,
        body: events.slice(0, 3).map((e) => e.title).join(" · "),
        sound: "default",
      },
      trigger: null,
    });
  } catch {
    // Notifications are best-effort — never break the feed for them.
  }
}
