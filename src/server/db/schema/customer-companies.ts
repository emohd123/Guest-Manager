import { pgTable, uuid, varchar, text, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { companies } from "./companies";

/** Customer/organizer companies managed by a platform company. */
export const customerCompanies = pgTable("customer_companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerCompanyId: uuid("owner_company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  legalName: varchar("legal_name", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }),
  email: varchar("email", { length: 320 }).notNull(),
  mobile: varchar("mobile", { length: 40 }),
  vatNumber: varchar("vat_number", { length: 80 }),
  website: text("website"),
  country: varchar("country", { length: 120 }),
  address: jsonb("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (table) => ({
  ownerIdx: index("customer_companies_owner_idx").on(table.ownerCompanyId),
  emailIdx: index("customer_companies_owner_email_idx").on(table.ownerCompanyId, table.email),
}));
