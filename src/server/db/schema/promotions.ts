import { pgTable, uuid, varchar, text, integer, boolean, timestamp, numeric, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { events } from "./events";

export const discountTypeEnum = pgEnum("discount_type", ["percentage", "fixed"]);

export const promotions = pgTable("promotions", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 255 }).notNull(),
  description: text("description"),
  discountType: discountTypeEnum("discount_type").default("percentage").notNull(),
  value: numeric("value", { precision: 10, scale: 2 }).notNull(),
  maxUses: integer("max_uses"),
  currentUses: integer("current_uses").default(0),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
