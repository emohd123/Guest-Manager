import { Platform } from "react-native";
import type { MobileGuest } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any = null;
let dbInitAttempted = false;
const memoryCache = new Map<string, MobileGuest>();

function getDb() {
  if (Platform.OS === "web") return null;
  if (dbInitAttempted) return db;

  dbInitAttempted = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SQLite = require("expo-sqlite");
    db = SQLite.openDatabaseSync("guest-manager-mobile-v2.db");
  } catch (error) {
    console.error("[guestCache] Falling back to in-memory cache", error);
    db = null;
  }

  return db;
}

export function initGuestCache() {
  const activeDb = getDb();
  if (!activeDb) return;
  activeDb.execSync(`
    CREATE TABLE IF NOT EXISTS guests_cache (
      id TEXT PRIMARY KEY NOT NULL,
      event_id TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

export function upsertGuests(eventId: string, guests: MobileGuest[]) {
  const activeDb = getDb();
  if (!activeDb) {
    guests.forEach((guest) => memoryCache.set(guest.id, guest));
    return;
  }

  initGuestCache();
  const now = new Date().toISOString();
  activeDb.withTransactionSync(() => {
    guests.forEach((guest) => {
      activeDb.runSync(
        `INSERT OR REPLACE INTO guests_cache (id, event_id, payload_json, updated_at)
         VALUES (?, ?, ?, ?)`,
        [guest.id, eventId, JSON.stringify(guest), now]
      );
    });
  });
}

export function getCachedGuests(eventId: string): MobileGuest[] {
  const activeDb = getDb();
  if (!activeDb) {
    return Array.from(memoryCache.values());
  }

  initGuestCache();
  const rows = activeDb.getAllSync(
    `SELECT payload_json FROM guests_cache WHERE event_id = ? ORDER BY updated_at DESC`,
    [eventId]
  ) as Array<{ payload_json: string }>;

  return rows.map((row) => JSON.parse(row.payload_json) as MobileGuest);
}
