import { pgTable, uuid, varchar, integer, text, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { events } from "./events";
import { contacts } from "./contacts";
import { ticketTypes } from "./ticket-types";

export const orderStatusEnum = pgEnum("order_status", [
  "cart",
  "pending",
  "completed",
  "cancelled",
  "refunded",
]);

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  eventId: uuid("event_id").references(() => events.id).notNull(),
  contactId: uuid("contact_id").references(() => contacts.id),
  orderNumber: varchar("order_number", { length: 50 }).unique().notNull(),
  status: orderStatusEnum("status").default("cart"),
  email: varchar("email", { length: 255 }),
  name: varchar("name", { length: 255 }),
  subtotal: integer("subtotal").default(0),
  tax: integer("tax").default(0),
  serviceFee: integer("service_fee").default(0),
  discount: integer("discount").default(0),
  total: integer("total").default(0),
  currency: varchar("currency", { length: 3 }).default("USD"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  stripeChargeId: varchar("stripe_charge_id", { length: 255 }),
  completedAt: timestamp("completed_at"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  ticketTypeId: uuid("ticket_type_id").references(() => ticketTypes.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  total: integer("total").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
