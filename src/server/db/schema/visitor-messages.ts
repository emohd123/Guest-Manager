import { pgTable, uuid, text, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { events } from "./events";

// Two-way visitor <-> organizer messages (attendee portal).
// Historically created directly in Supabase; captured here so schema pushes keep it.
export const visitorMessages = pgTable(
  "visitor_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    guestEmail: text("guest_email").notNull(),
    guestName: text("guest_name"),
    subject: text("subject"),
    body: text("body").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    adminReply: text("admin_reply"),
    repliedAt: timestamp("replied_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("visitor_messages_event_id_idx").on(table.eventId)],
);
