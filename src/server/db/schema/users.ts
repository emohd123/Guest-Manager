import { pgTable, uuid, varchar, text, boolean, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { customerCompanies } from "./customer-companies";

export const userRoleEnum = pgEnum("user_role", ["owner", "admin", "manager", "staff"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // matches Supabase auth.users.id
  companyId: uuid("company_id").references(() => companies.id),
  customerCompanyId: uuid("customer_company_id").references(() => customerCompanies.id, { onDelete: "set null" }),
  email: varchar("email", { length: 255 }).unique().notNull(),
  name: varchar("name", { length: 255 }),
  avatarUrl: text("avatar_url"),
  role: userRoleEnum("role").default("owner").notNull(),
  emailVerified: boolean("email_verified").default(false),
  dashboardAccess: varchar("dashboard_access", { length: 16 }).default("none").notNull(),
  dashboardPermissions: jsonb("dashboard_permissions").$type<string[]>().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
