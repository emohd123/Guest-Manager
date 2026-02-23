import { pgTable, uuid, varchar, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  logoUrl: text("logo_url"),
  address: jsonb("address"),
  timezone: varchar("timezone", { length: 50 }).default("America/Los_Angeles"),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
