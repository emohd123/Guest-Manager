import { pgTable, uuid, text, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { users } from "./users";
import { events } from "./events";

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id),
  actorId: uuid("actor_id").references(() => users.id),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("audit_logs_company_created_idx").on(table.companyId, table.createdAt),
  index("audit_logs_actor_created_idx").on(table.actorId, table.createdAt),
  index("audit_logs_event_created_idx").on(table.eventId, table.createdAt),
]);
