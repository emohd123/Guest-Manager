import { Platform } from "react-native";
import type { MobileGuest } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any = null;
const memoryCache = new Map<string, MobileGuest>();

if (Platform.OS !== "web") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const SQLite = require("expo-sqlite");
  db = SQLite.openDatabaseSync("guest-manager-mobile-v2.db");
}

export function initGuestCache() {
  if (Platform.OS === "web") return;
  if (!db) return;
  db.execSync(`
    CREATE TABLE IF NOT EXISTS guests_cache (
      id TEXT PRIMARY KEY NOT NULL,
      event_id TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

export function upsertGuests(eventId: string, guests: MobileGuest[]) {
  if (Platform.OS === "web") {
    guests.forEach((guest) => memoryCache.set(guest.id, guest));
    return;
  }

  if (!db) return;
  initGuestCache();
  const now = new Date().toISOString();
  db.withTransactionSync(() => {
    guests.forEach((guest) => {
      db.runSync(
        `INSERT OR REPLACE INTO guests_cache (id, event_id, payload_json, updated_at)
         VALUES (?, ?, ?, ?)`,
        [guest.id, eventId, JSON.stringify(guest), now]
      );
    });
  });
}

export function getCachedGuests(eventId: string): MobileGuest[] {
  if (Platform.OS === "web") {
    return Array.from(memoryCache.values());
  }

  if (!db) return [];
  initGuestCache();
  const rows = db.getAllSync(
    `SELECT payload_json FROM guests_cache WHERE event_id = ? ORDER BY updated_at DESC`,
    [eventId]
  ) as Array<{ payload_json: string }>;

  return rows.map((row) => JSON.parse(row.payload_json) as MobileGuest);
}

