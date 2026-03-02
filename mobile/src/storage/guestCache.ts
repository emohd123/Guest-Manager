import * as SQLite from "expo-sqlite";
import type { MobileGuest } from "../types";

const db = SQLite.openDatabaseSync("guest-manager-mobile-v2.db");

export function initGuestCache() {
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
  const rows = db.getAllSync<{ payload_json: string }>(
    `SELECT payload_json FROM guests_cache WHERE event_id = ? ORDER BY updated_at DESC`,
    [eventId]
  );

  return rows.map((row) => JSON.parse(row.payload_json) as MobileGuest);
}

