import {
  boolean,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { events } from "./events";
import { users } from "./users";

export const eventDeviceAccess = pgTable(
  "event_device_access",
  {
    eventId: uuid("event_id")
      .primaryKey()
      .references(() => events.id, { onDelete: "cascade" }),
    accessCode: varchar("access_code", { length: 6 }).notNull(),
    pinHash: text("pin_hash").notNull(),
    isEnabled: boolean("is_enabled").default(true).notNull(),
    lastRotatedAt: timestamp("last_rotated_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("event_device_access_access_code_idx").on(table.accessCode)]
);
