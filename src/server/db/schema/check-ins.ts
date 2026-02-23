import { pgTable, uuid, varchar, boolean, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { events } from "./events";
import { guests } from "./guests";
import { tickets } from "./tickets";
import { users } from "./users";
import { companies } from "./companies";

export const checkInActionEnum = pgEnum("check_in_action", ["check_in", "check_out", "undo"]);
export const checkInMethodEnum = pgEnum("check_in_method", ["manual", "scan", "search", "walkup"]);

export const checkIns = pgTable("check_ins", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  guestId: uuid("guest_id").references(() => guests.id),
  ticketId: uuid("ticket_id").references(() => tickets.id),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  deviceId: varchar("device_id", { length: 255 }),
  deviceName: varchar("device_name", { length: 255 }),
  action: checkInActionEnum("action").notNull(),
  method: checkInMethodEnum("method").notNull(),
  location: varchar("location", { length: 255 }),
  scannedBarcode: varchar("scanned_barcode", { length: 255 }),
  isDuplicate: boolean("is_duplicate").default(false),
  notes: text("notes"),
  performedBy: uuid("performed_by").references(() => users.id),
  performedAt: timestamp("performed_at").defaultNow().notNull(),
  synced: boolean("synced").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
