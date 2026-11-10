import "server-only";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { pushEventNotification } from "@/server/services/notification-devices";

export type NotificationType =
  | "event_update"
  | "agenda_update"
  | "message_reply"
  | "networking_request"
  | "networking_accept"
  | "meeting_update"
  | "session_reminder"
  | "live_stream"
  | "chat_message";
interface CreateNotificationsOptions {
  eventId: string;
  title: string;
  body: string;
  type: NotificationType;
  recipientEmail?: string;
}

export async function createEventNotifications(
  opts: CreateNotificationsOptions,
) {
  try {
    const admin = createSupabaseAdminClient();
    let emails: string[];
    if (opts.recipientEmail)
      emails = [opts.recipientEmail.trim().toLowerCase()];
    else {
      const [guests, tickets] = await Promise.all([
        admin
          .from("guests")
          .select("email")
          .eq("event_id", opts.eventId)
          .not("email", "is", null),
        admin
          .from("tickets")
          .select("attendee_email")
          .eq("event_id", opts.eventId)
          .not("attendee_email", "is", null),
      ]);
      if (guests.error || tickets.error)
        throw new Error("Could not load notification recipients");
      emails = [
        ...new Set(
          [
            ...(guests.data ?? []).map((item) => item.email),
            ...(tickets.data ?? []).map((item) => item.attendee_email),
          ]
            .filter(
              (email): email is string =>
                typeof email === "string" && !!email.trim(),
            )
            .map((email) => email.trim().toLowerCase()),
        ),
      ];
    }
    for (let offset = 0; offset < emails.length; offset += 250) {
      const { error } = await admin.from("visitor_notifications").insert(
        emails.slice(offset, offset + 250).map((email) => ({
          event_id: opts.eventId,
          recipient_email: email,
          title: opts.title,
          body: opts.body,
          type: opts.type,
        })),
      );
      if (error) throw error;
    }
    let delivery = { accepted: 0, failed: 0 };
    try {
      delivery = await pushEventNotification({
        ...opts,
        emails,
        recipientOnly: !!opts.recipientEmail,
      });
    } catch {
      console.error("Push delivery unavailable; notification saved in inbox");
    }
    return {
      stored: emails.length,
      pushAccepted: delivery.accepted,
      pushFailed: delivery.failed,
    };
  } catch {
    console.error("Could not save event notifications");
    return null;
  }
}
