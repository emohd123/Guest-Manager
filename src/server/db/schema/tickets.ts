import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { events } from "./events";
import { ticketTypes } from "./ticket-types";
import { guests } from "./guests";
import { contacts } from "./contacts";
import { users } from "./users";

export const ticketStatusEnum = pgEnum("ticket_status", ["valid", "voided", "expired", "used"]);

export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  ticketTypeId: uuid("ticket_type_id").references(() => ticketTypes.id).notNull(),
  orderId: uuid("order_id"),
  guestId: uuid("guest_id").references(() => guests.id),
  contactId: uuid("contact_id").references(() => contacts.id),
  barcode: varchar("barcode", { length: 255 }).unique().notNull(),
  barcodeType: varchar("barcode_type", { length: 20 }).default("qr"),
  barcodeUrl: text("barcode_url"),
  pdfUrl: text("pdf_url"),
  walletUrl: text("wallet_url"),
  status: ticketStatusEnum("status").default("valid"),
  attendeeName: varchar("attendee_name", { length: 255 }),
  attendeeEmail: varchar("attendee_email", { length: 255 }),
  checkedIn: boolean("checked_in").default(false),
  checkedInAt: timestamp("checked_in_at"),
  checkedInBy: uuid("checked_in_by").references(() => users.id),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
