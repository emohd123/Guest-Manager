import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  integer,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { events } from "./events";
import { companies } from "./companies";

export const pairedViaEnum = pgEnum("paired_via", ["code_pin", "qr", "staff"]);

export const devices = pgTable("devices", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => `dev_${crypto.randomUUID().replace(/-/g, "")}`),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status", { enum: ["online", "offline"] }).notNull().default("offline"),
  battery: integer("battery").default(100),
  appVersion: text("app_version"),
  installationId: text("installation_id"),
  platform: varchar("platform", { length: 20 }),
  model: varchar("model", { length: 100 }),
  osVersion: varchar("os_version", { length: 50 }),
  pairedVia: pairedViaEnum("paired_via"),
  station: varchar("station", { length: 120 }),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  lastReportAt: timestamp("last_report_at", { withTimezone: true }),
  scannerBattery: integer("scanner_battery"),
  scannerChargeState: varchar("scanner_charge_state", { length: 40 }),
  onsitePin: varchar("onsite_pin", { length: 10 }),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});
