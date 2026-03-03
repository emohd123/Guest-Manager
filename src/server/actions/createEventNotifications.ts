// createEventNotifications.ts
// Server action called when admin saves event/agenda changes
// Creates visitor_notifications rows for all guests with tickets on that event

"use server";

import { getDb } from "@/server/db";
import { guests as guestsTable, tickets as ticketsTable } from "@/server/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import { nanoid } from "nanoid";

/** Raw DB insert — Drizzle schema for visitor_notifications isn't generated yet,
 *  so we use a raw SQL approach via pg pool */
import { sql } from "drizzle-orm";

export type NotificationType = "event_update" | "agenda_update" | "message_reply";

interface CreateNotificationsOptions {
  eventId: string;
  title: string;
  body: string;
  type: NotificationType;
  /** If set, only send to this specific email. Otherwise broadcast to all event guests. */
  recipientEmail?: string;
}

export async function createEventNotifications(opts: CreateNotificationsOptions) {
  const { eventId, title, body, type, recipientEmail } = opts;

  try {
    const db = getDb();

    if (recipientEmail) {
      // Targeted notification (e.g. message reply)
      await db.execute(sql`
        INSERT INTO visitor_notifications (event_id, recipient_email, title, body, type)
        VALUES (${eventId}, ${recipientEmail}, ${title}, ${body}, ${type})
      `);
    } else {
      // Broadcast to all unique attendee emails for this event
      const emailRows = await db
        .selectDistinct({ email: guestsTable.email })
        .from(guestsTable)
        .where(
          and(
            eq(guestsTable.eventId, eventId),
            isNotNull(guestsTable.email)
          )
        );

      if (!emailRows.length) {
        // Fallback: find emails from tickets table
        const ticketEmails = await db
          .selectDistinct({ email: ticketsTable.attendeeEmail })
          .from(ticketsTable)
          .where(
            and(
              eq(ticketsTable.eventId, eventId),
              isNotNull(ticketsTable.attendeeEmail)
            )
          );

        for (const row of ticketEmails) {
          if (!row.email) continue;
          await db.execute(sql`
            INSERT INTO visitor_notifications (event_id, recipient_email, title, body, type)
            VALUES (${eventId}, ${row.email}, ${title}, ${body}, ${type})
          `);
        }
      } else {
        for (const row of emailRows) {
          if (!row.email) continue;
          await db.execute(sql`
            INSERT INTO visitor_notifications (event_id, recipient_email, title, body, type)
            VALUES (${eventId}, ${row.email}, ${title}, ${body}, ${type})
          `);
        }
      }
    }
    console.log(`[createEventNotifications] Sent "${title}" for event ${eventId}`);
  } catch (err) {
    console.error("[createEventNotifications] Failed:", err);
    // Non-fatal — don't throw to caller
  }
}
