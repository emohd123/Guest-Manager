import { pgTable, uuid, varchar, integer, text, timestamp } from "drizzle-orm/pg-core";
import { companies } from "./companies";

export const creditLedger = pgTable("credit_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  amount: integer("amount").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  action: varchar("action", { length: 100 }),
  referenceType: varchar("reference_type", { length: 50 }),
  referenceId: uuid("reference_id"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
