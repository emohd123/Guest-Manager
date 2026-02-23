import { pgTable, uuid, varchar, text, integer, boolean, timestamp, jsonb, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { venues } from "./venues";
import { categories } from "./categories";

export const eventTypeEnum = pgEnum("event_type", [
  "single",
  "recurring",
  "multi_day",
  "session",
  "conference",
]);

export const eventStatusEnum = pgEnum("event_status", [
  "draft",
  "published",
  "cancelled",
  "completed",
]);

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").references(() => companies.id).notNull(),
    venueId: uuid("venue_id").references(() => venues.id),
    categoryId: uuid("category_id").references(() => categories.id),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),
    shortDescription: text("short_description"),
    coverImageUrl: text("cover_image_url"),
    eventType: eventTypeEnum("event_type").default("single").notNull(),
    status: eventStatusEnum("status").default("draft").notNull(),
    startsAt: timestamp("starts_at").notNull(),
    endsAt: timestamp("ends_at"),
    timezone: varchar("timezone", { length: 50 }).default("America/Los_Angeles"),
    registrationEnabled: boolean("registration_enabled").default(false),
    registrationOpensAt: timestamp("registration_opens_at"),
    registrationClosesAt: timestamp("registration_closes_at"),
    maxCapacity: integer("max_capacity"),
    settings: jsonb("settings").default({}),
    customFields: jsonb("custom_fields").default([]),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    uniqueIndex("events_company_slug_idx").on(table.companyId, table.slug),
  ]
);

export const eventSessions = pgTable("event_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 255 }),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  location: varchar("location", { length: 255 }),
  capacity: integer("capacity"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
