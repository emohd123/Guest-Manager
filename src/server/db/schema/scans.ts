import { pgTable, uuid, varchar, text, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { events } from "./events";
import { tickets } from "./tickets";
import { users } from "./users";

export const scanTypeEnum = pgEnum("scan_type", ["check_in", "checkout", "invalid"]);

export const scans = pgTable("scans", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  ticketId: uuid("ticket_id").references(() => tickets.id, { onDelete: "cascade" }),
  scannedBy: uuid("scanned_by").references(() => users.id),
  scanType: scanTypeEnum("scan_type").default("check_in").notNull(),
  barcode: varchar("barcode", { length: 255 }),
  result: varchar("result", { length: 50 }),
  notes: text("notes"),
  deviceInfo: jsonb("device_info").default({}),
  scannedAt: timestamp("scanned_at").defaultNow().notNull(),
});
