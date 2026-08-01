import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { events } from "./events";
import { tickets } from "./tickets";
import { orders } from "./orders";

export const seatingPlans = pgTable("seating_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .references(() => events.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  floorPlanUrl: text("floor_plan_url"),
  enabled: boolean("enabled").default(false).notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const seatSections = pgTable("seat_sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id")
    .references(() => seatingPlans.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  price: integer("price"),
  x: integer("x").default(0).notNull(),
  y: integer("y").default(0).notNull(),
  width: integer("width").default(30).notNull(),
  height: integer("height").default(20).notNull(),
  rotation: integer("rotation").default(0).notNull(),
  color: varchar("color", { length: 20 }).default("#22d3ee").notNull(),
  seatSpacing: integer("seat_spacing").default(100).notNull(),
  rowSpacing: integer("row_spacing").default(100).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const seatRows = pgTable(
  "seat_rows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sectionId: uuid("section_id")
      .references(() => seatSections.id, { onDelete: "cascade" })
      .notNull(),
    label: varchar("label", { length: 30 }).notNull(),
    price: integer("price"),
    color: varchar("color", { length: 20 }),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (table) => [
    uniqueIndex("seat_rows_section_label_idx").on(table.sectionId, table.label),
  ],
);

export const reservedSeats = pgTable(
  "reserved_seats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    rowId: uuid("row_id")
      .references(() => seatRows.id, { onDelete: "cascade" })
      .notNull(),
    label: varchar("label", { length: 30 }).notNull(),
    price: integer("price"),
    color: varchar("color", { length: 20 }),
    category: varchar("category", { length: 80 }),
    inventoryStatus: varchar("inventory_status", { length: 20 })
      .default("available")
      .notNull(),
    x: integer("x"),
    y: integer("y"),
    accessible: boolean("accessible").default(false).notNull(),
    soldTicketId: uuid("sold_ticket_id").references(() => tickets.id),
  },
  (table) => [
    uniqueIndex("reserved_seats_row_label_idx").on(table.rowId, table.label),
  ],
);

export const seatHolds = pgTable("seat_holds", {
  id: uuid("id").primaryKey().defaultRandom(),
  seatId: uuid("seat_id")
    .references(() => reservedSeats.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  eventId: uuid("event_id")
    .references(() => events.id, { onDelete: "cascade" })
    .notNull(),
  holdToken: uuid("hold_token").notNull(),
  orderId: uuid("order_id").references(() => orders.id),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
