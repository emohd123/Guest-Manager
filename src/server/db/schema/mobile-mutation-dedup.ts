import { pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { devices } from "./devices";
import { events } from "./events";

export const mobileMutationDedup = pgTable(
  "mobile_mutation_dedup",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    deviceId: text("device_id")
      .notNull()
      .references(() => devices.id, { onDelete: "cascade" }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    clientMutationId: varchar("client_mutation_id", { length: 120 }).notNull(),
    responseHash: text("response_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("mobile_mutation_dedup_device_mutation_idx").on(
      table.deviceId,
      table.clientMutationId
    ),
  ]
);
