import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { events } from "./events";
import { companies } from "./companies";
import { devices } from "./devices";

export const deviceCommandTypeEnum = pgEnum("device_command_type", ["ping"]);
export const deviceCommandStatusEnum = pgEnum("device_command_status", ["pending", "ack", "expired"]);

export const deviceCommands = pgTable("device_commands", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  deviceId: text("device_id")
    .notNull()
    .references(() => devices.id, { onDelete: "cascade" }),
  commandType: deviceCommandTypeEnum("command_type").default("ping").notNull(),
  payload: jsonb("payload").default({}).notNull(),
  status: deviceCommandStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  ackAt: timestamp("ack_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
