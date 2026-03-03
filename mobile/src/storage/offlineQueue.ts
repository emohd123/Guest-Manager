import { Platform } from "react-native";
import type { QueueItem } from "../types";

let db: any = null;
if (Platform.OS !== "web") {
  const SQLite = require("expo-sqlite");
  db = SQLite.openDatabaseSync("guest-manager-mobile-v2.db");
}
function ensureQueueTable() {
  if (!db) return;
  db.execSync(`
    CREATE TABLE IF NOT EXISTS mobile_mutation_queue (
      id TEXT PRIMARY KEY NOT NULL,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      event_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

function toRow(item: QueueItem) {
  return {
    id: item.id,
    endpoint: item.endpoint,
    method: item.method,
    payload_json: JSON.stringify(item.payload),
    event_id: item.eventId,
    created_at: item.createdAt,
  };
}

export function initOfflineQueue() {
  ensureQueueTable();
}

export function enqueueMutation(item: QueueItem) {
  if (!db) return;
  ensureQueueTable();
  const row = toRow(item);
  db.runSync(
    `INSERT OR REPLACE INTO mobile_mutation_queue (id, endpoint, method, payload_json, event_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [row.id, row.endpoint, row.method, row.payload_json, row.event_id, row.created_at]
  );
}

export function listQueuedMutations(): QueueItem[] {
  if (!db) return [];
  ensureQueueTable();
  const rows = db.getAllSync(
    `SELECT id, endpoint, method, payload_json, event_id, created_at
     FROM mobile_mutation_queue
     ORDER BY created_at ASC`
  ) as Array<{
    id: string;
    endpoint: string;
    method: "POST";
    payload_json: string;
    event_id: string;
    created_at: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    endpoint: row.endpoint,
    method: row.method,
    payload: JSON.parse(row.payload_json),
    eventId: row.event_id,
    createdAt: row.created_at,
  }));
}

export function removeQueuedMutation(id: string) {
  if (!db) return;
  ensureQueueTable();
  db.runSync(`DELETE FROM mobile_mutation_queue WHERE id = ?`, [id]);
}
