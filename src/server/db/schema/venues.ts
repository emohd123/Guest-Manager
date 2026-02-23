import { pgTable, uuid, varchar, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { companies } from "./companies";

export const venues = pgTable("venues", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  address: jsonb("address"),
  timezone: varchar("timezone", { length: 50 }),
  capacity: integer("capacity"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
