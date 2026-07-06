import { pgTable, uuid, text, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { events } from "./events";

// Attendee-portal notifications (broadcast when recipient_email is null).
// Historically created directly in Supabase; captured here so schema pushes keep it.
export const visitorNotifications = pgTable(
  "visitor_notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    recipientEmail: text("recipient_email"),
    title: text("title").notNull(),
    body: text("body").notNull(),
    type: text("type").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("visitor_notifications_recipient_email_idx").on(table.recipientEmail)],
);
