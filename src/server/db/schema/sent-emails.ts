import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { events } from "./events";

export const sentEmails = pgTable("sent_emails", {
  id: text("id")
    .$defaultFn(() => nanoid())
    .primaryKey(),
  eventId: text("event_id").references(() => events.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("Ticket sent"), // e.g., 'Ticket sent', 'Ticket voided'
  state: text("state").notNull().default("Delivered"), // e.g., 'Delivered'
  status: text("status").notNull().default("Unopened"), // e.g., 'Opened', 'Unopened'
  emailAddress: text("email_address").notNull(),
  subject: text("subject").notNull(),
  resendId: text("resend_id"),
  openCount: integer("open_count").notNull().default(0),
  clickCount: integer("click_count").notNull().default(0),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
