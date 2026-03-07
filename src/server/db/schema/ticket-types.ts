import { pgTable, uuid, varchar, text, integer, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { events } from "./events";

export const barcodeTypeEnum = pgEnum("barcode_type", ["qr", "pdf417", "code128", "ean13"]);

export const ticketTypeStatusEnum = pgEnum("ticket_type_status", [
  "active",
  "paused",
  "sold_out",
  "archived",
]);

export const ticketTypes = pgTable("ticket_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: integer("price").default(0),
  currency: varchar("currency", { length: 3 }).default("USD"),
  quantityTotal: integer("quantity_total"),
  quantitySold: integer("quantity_sold").default(0),
  saleStartsAt: timestamp("sale_starts_at"),
  saleEndsAt: timestamp("sale_ends_at"),
  minPerOrder: integer("min_per_order").default(1),
  maxPerOrder: integer("max_per_order").default(10),
  transferable: boolean("transferable").default(false),
  requiresInfo: boolean("requires_info").default(false),
  barcodeType: barcodeTypeEnum("barcode_type").default("qr"),
  walletEnabled: boolean("wallet_enabled").default(false),
  status: ticketTypeStatusEnum("status").default("active"),
  sortOrder: integer("sort_order").default(0),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
