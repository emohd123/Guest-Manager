import { sql } from "drizzle-orm";
import {
  pgSchema,
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  index,
  check,
} from "drizzle-orm/pg-core";
import { events } from "./events";
const authUsers = pgSchema("auth").table("users", {
  id: uuid("id").primaryKey(),
});

export const notificationDevices = pgTable(
  "notification_devices",
  {
    id: uuid("id").primaryKey(),
    secretHash: text("secret_hash").notNull(),
    token: text("token").unique().notNull(),
    platform: text("platform").notNull(),
    userId: uuid("user_id").references(() => authUsers.id, {
      onDelete: "cascade",
    }),
    recipientEmail: text("recipient_email"),
    conferenceEventId: uuid("conference_event_id").references(() => events.id, {
      onDelete: "cascade",
    }),
    conferenceRole: text("conference_role"),
    conferenceExpiresAt: timestamp("conference_expires_at", {
      withTimezone: true,
    }),
    eventUpdates: boolean("event_updates").notNull().default(true),
    newEvents: boolean("new_events").notNull().default(false),
    enabled: boolean("enabled").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("notification_devices_email_idx")
      .on(table.recipientEmail)
      .where(sql`${table.enabled}`),
    index("notification_devices_conference_idx").on(
      table.conferenceEventId,
      table.conferenceExpiresAt,
    ),
    index("notification_devices_user_idx").on(table.userId),
    check(
      "notification_devices_secret_hash_check",
      sql`length(${table.secretHash}) = 64`,
    ),
    check(
      "notification_devices_platform_check",
      sql`${table.platform} in ('android','ios')`,
    ),
    check(
      "notification_devices_conference_role_check",
      sql`${table.conferenceRole} in ('attendee','speaker')`,
    ),
  ],
).enableRLS();
