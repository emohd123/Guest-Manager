import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dns from "dns";
import * as schema from "./schema";

// Supabase direct connections use IPv6 — ensure DNS resolves correctly
dns.setDefaultResultOrder("verbatim");

let _db: ReturnType<typeof createDb> | null = null;

function createDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  const client = postgres(connectionString, {
    prepare: false,
    connect_timeout: 15,
  });
  return drizzle(client, { schema });
}

export function getDb() {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}
