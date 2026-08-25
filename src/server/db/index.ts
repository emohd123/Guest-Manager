import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let _db: ReturnType<typeof createDb> | null = null;

function createDb() {
  // Serverless functions must prefer the pooled connection. Supabase's direct
  // endpoint is IPv6-only unless the project has the IPv4 add-on, which can
  // make otherwise healthy API requests fail only when they reach Postgres.
  const connectionString =
    process.env.POSTGRES_URL ??
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL_NON_POOLING;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  const client = postgres(connectionString, {
    prepare: false,
    connect_timeout: 15,
    ssl: { rejectUnauthorized: false },
  });
  return drizzle(client, { schema });
}

export function getDb() {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}
