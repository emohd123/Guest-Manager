import { Platform } from "react-native";
import type { QueueItem } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any = null;
let dbInitAttempted = false;
const memoryQueue: QueueItem[] = [];

function getDb() {
  if (Platform.OS === "web") return null;
  if (dbInitAttempted) return db;

  dbInitAttempted = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SQLite = require("expo-sqlite");
    db = SQLite.openDatabaseSync("guest-manager-mobile-v2.db");
  } catch (error) {
    console.error("[offlineQueue] Falling back to in-memory queue", error);
    db = null;
  }

  return db;
}

function ensureQueueTable() {
  const activeDb = getDb();
  if (!activeDb) return;
  activeDb.execSync(`
    CREATE TABLE IF NOT EXISTS mobile_mutation_queue (
      id TEXT PRIMARY KEY NOT NULL,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      event_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0
    );
  `);
  // Migrate older tables created before the attempts column existed.
  try {
    activeDb.execSync(
      `ALTER TABLE mobile_mutation_queue ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0`
    );
  } catch {
    // Column already exists — expected on every run after the first migration.
  }
}

function toRow(item: QueueItem) {
  return {
    id: item.id,
    endpoint: item.endpoint,
    method: item.method,
    payload_json: JSON.stringify(item.payload),
    event_id: item.eventId,
    created_at: item.createdAt,
    attempts: item.attempts ?? 0,
  };
}

export function initOfflineQueue() {
  ensureQueueTable();
}

export function enqueueMutation(item: QueueItem) {
  const activeDb = getDb();
  if (!activeDb) {
    memoryQueue.push(item);
    return;
  }
  ensureQueueTable();
  const row = toRow(item);
  activeDb.runSync(
    `INSERT OR REPLACE INTO mobile_mutation_queue (id, endpoint, method, payload_json, event_id, created_at, attempts)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [row.id, row.endpoint, row.method, row.payload_json, row.event_id, row.created_at, row.attempts]
  );
}

// Increment the retry counter for a queued mutation and return the new count.
// Falls back to mutating the in-memory queue when SQLite is unavailable.
export function bumpQueuedMutationAttempt(id: string): number {
  const activeDb = getDb();
  if (!activeDb) {
    const item = memoryQueue.find((q) => q.id === id);
    if (!item) return 0;
    item.attempts = (item.attempts ?? 0) + 1;
    return item.attempts;
  }
  ensureQueueTable();
  activeDb.runSync(
    `UPDATE mobile_mutation_queue SET attempts = attempts + 1 WHERE id = ?`,
    [id]
  );
  const row = activeDb.getFirstSync(
    `SELECT attempts FROM mobile_mutation_queue WHERE id = ?`,
    [id]
  ) as { attempts: number } | null;
  return row?.attempts ?? 0;
}

export function listQueuedMutations(): QueueItem[] {
  const activeDb = getDb();
  if (!activeDb) {
    return [...memoryQueue];
  }
  ensureQueueTable();
  // Order by SQLite's implicit monotonic rowid (true insertion order) rather
  // than created_at — two mutations enqueued in the same millisecond share a
  // created_at and would otherwise replay in arbitrary order, which can cause
  // a check-out to replay before its check-in (lost update).
  const rows = activeDb.getAllSync(
    `SELECT id, endpoint, method, payload_json, event_id, created_at, attempts
     FROM mobile_mutation_queue
     ORDER BY rowid ASC`
  ) as Array<{
    id: string;
    endpoint: string;
    method: "POST";
    payload_json: string;
    event_id: string;
    created_at: string;
    attempts: number | null;
  }>;

  return rows.map((row) => ({
    id: row.id,
    endpoint: row.endpoint,
    method: row.method,
    payload: JSON.parse(row.payload_json),
    eventId: row.event_id,
    createdAt: row.created_at,
    attempts: row.attempts ?? 0,
  }));
}

export function removeQueuedMutation(id: string) {
  const activeDb = getDb();
  if (!activeDb) {
    const idx = memoryQueue.findIndex((q) => q.id === id);
    if (idx !== -1) memoryQueue.splice(idx, 1);
    return;
  }
  ensureQueueTable();
  activeDb.runSync(`DELETE FROM mobile_mutation_queue WHERE id = ?`, [id]);
}
