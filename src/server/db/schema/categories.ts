import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { companies } from "./companies";

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }),
  color: varchar("color", { length: 7 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
