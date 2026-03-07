"use server";

import { createClient } from "@supabase/supabase-js";

export type NotificationType = "event_update" | "agenda_update" | "message_reply";

interface CreateNotificationsOptions {
  eventId: string;
  title: string;
  body: string;
  type: NotificationType;
  recipientEmail?: string;
}

function getSupabaseRestClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase environment variables are not configured");
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function createEventNotifications(opts: CreateNotificationsOptions) {
  const { eventId, title, body, type, recipientEmail } = opts;

  try {
    const supabase = getSupabaseRestClient();

    if (recipientEmail) {
      const { error } = await supabase.from("visitor_notifications").insert({
        event_id: eventId,
        recipient_email: recipientEmail,
        title,
        body,
        type,
      });

      if (error) throw error;
      return;
    }

    const { data: guests, error: guestsError } = await supabase
      .from("guests")
      .select("email")
      .eq("event_id", eventId)
      .not("email", "is", null);

    if (guestsError) throw guestsError;

    const guestEmails = [...new Set((guests ?? []).map((guest) => guest.email).filter(Boolean))];
    let recipientEmails = guestEmails;

    if (recipientEmails.length === 0) {
      const { data: tickets, error: ticketsError } = await supabase
        .from("tickets")
        .select("attendee_email")
        .eq("event_id", eventId)
        .not("attendee_email", "is", null);

      if (ticketsError) throw ticketsError;

      recipientEmails = [...new Set((tickets ?? []).map((ticket) => ticket.attendee_email).filter(Boolean))];
    }

    if (recipientEmails.length === 0) {
      return;
    }

    const rows = recipientEmails.map((email) => ({
      event_id: eventId,
      recipient_email: email,
      title,
      body,
      type,
    }));

    const { error } = await supabase.from("visitor_notifications").insert(rows);
    if (error) throw error;
  } catch (err) {
    console.error("[createEventNotifications] Failed:", err);
  }
}
