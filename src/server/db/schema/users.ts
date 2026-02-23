import { pgTable, uuid, varchar, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { companies } from "./companies";

export const userRoleEnum = pgEnum("user_role", ["owner", "admin", "manager", "staff"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // matches Supabase auth.users.id
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  name: varchar("name", { length: 255 }),
  avatarUrl: text("avatar_url"),
  role: userRoleEnum("role").default("owner").notNull(),
  emailVerified: boolean("email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
