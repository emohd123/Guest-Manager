import { pgTable, text, timestamp, integer, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { events } from "./events";
import { companies } from "./companies";

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
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});
