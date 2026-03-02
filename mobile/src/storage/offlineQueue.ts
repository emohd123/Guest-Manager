import * as SQLite from "expo-sqlite";
import type { QueueItem } from "../types";

const db = SQLite.openDatabaseSync("guest-manager-mobile-v2.db");
let queueTableReady = false;

function ensureQueueTable() {
  if (queueTableReady) return;
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
  queueTableReady = true;
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
  ensureQueueTable();
  const row = toRow(item);
  db.runSync(
    `INSERT OR REPLACE INTO mobile_mutation_queue (id, endpoint, method, payload_json, event_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [row.id, row.endpoint, row.method, row.payload_json, row.event_id, row.created_at]
  );
}

export function listQueuedMutations(): QueueItem[] {
  ensureQueueTable();
  const rows = db.getAllSync<{
    id: string;
    endpoint: string;
    method: "POST";
    payload_json: string;
    event_id: string;
    created_at: string;
  }>(
    `SELECT id, endpoint, method, payload_json, event_id, created_at
     FROM mobile_mutation_queue
     ORDER BY created_at ASC`
  );

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
  ensureQueueTable();
  db.runSync(`DELETE FROM mobile_mutation_queue WHERE id = ?`, [id]);
}
