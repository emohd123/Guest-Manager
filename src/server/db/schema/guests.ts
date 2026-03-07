import { pgTable, uuid, varchar, text, integer, jsonb, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { events } from "./events";
import { contacts } from "./contacts";
import { companies } from "./companies";

export const guestStatusEnum = pgEnum("guest_status", [
  "invited",
  "confirmed",
  "declined",
  "waitlisted",
  "checked_in",
  "no_show",
]);

export const rsvpStatusEnum = pgEnum("rsvp_status", [
  "pending",
  "accepted",
  "declined",
  "maybe",
]);

export const attendanceStateEnum = pgEnum("attendance_state", [
  "not_arrived",
  "checked_in",
  "checked_out",
]);

export const guests = pgTable("guests", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  contactId: uuid("contact_id").references(() => contacts.id),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  status: guestStatusEnum("status").default("invited").notNull(),
  partySize: integer("party_size").default(1),
  partyLeaderId: uuid("party_leader_id"),
  tableNumber: varchar("table_number", { length: 50 }),
  seatNumber: varchar("seat_number", { length: 50 }),
  notes: text("notes"),
  tags: text("tags").array(),
  guestType: varchar("guest_type", { length: 100 }),
  customData: jsonb("custom_data").default({}),
  rsvpStatus: rsvpStatusEnum("rsvp_status").default("pending"),
  rsvpAt: timestamp("rsvp_at"),
  source: varchar("source", { length: 100 }),
  sortOrder: integer("sort_order").default(0),
  checkedInAt: timestamp("checked_in_at"),
  checkedOutAt: timestamp("checked_out_at"),
  attendanceState: attendanceStateEnum("attendance_state").default("not_arrived").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
