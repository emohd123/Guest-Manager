import { pgTable, uuid, varchar, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { companies } from "./companies";

export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  companyName: varchar("company_name", { length: 255 }),
  title: varchar("title", { length: 255 }),
  notes: text("notes"),
  tags: text("tags").array(),
  contactType: varchar("contact_type", { length: 100 }),
  customData: jsonb("custom_data").default({}),
  photoUrl: text("photo_url"),
  source: varchar("source", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const lists = pgTable("lists", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const listContacts = pgTable("list_contacts", {
  listId: uuid("list_id").references(() => lists.id, { onDelete: "cascade" }).notNull(),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "cascade" }).notNull(),
});
