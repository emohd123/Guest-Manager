import { pgTable, uuid, varchar, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { events } from "./events";
import { users } from "./users";

export const importStatusEnum = pgEnum("import_status", ["pending", "processing", "completed", "failed"]);

export const dataImports = pgTable("data_imports", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id).notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  recordsProcessed: integer("records_processed").default(0),
  totalRecords: integer("total_records").default(0),
  status: importStatusEnum("status").default("pending").notNull(),
  errorLog: varchar("error_log", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
