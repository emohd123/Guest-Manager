import { pgTable, uuid, varchar, text, jsonb, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { companies } from "./companies";

export const templateTypeEnum = pgEnum("template_type", ["pdf", "apple_wallet"]);

export const ticketTemplates = pgTable("ticket_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  name: varchar("name", { length: 255 }),
  type: templateTypeEnum("type").default("pdf"),
  designData: jsonb("design_data").default({}),
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
