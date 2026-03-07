export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { ensureAppUserForAuthUser } from "@/server/auth/app-user";

/**
 * GET /api/dashboard/messages
 * Returns all visitor messages for the authenticated admin's company.
 */
export async function GET() {
  try {
    // Use cookie-based auth (dashboard uses SSR session cookies)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await ensureAppUserForAuthUser(supabase, user);

    if (!dbUser?.companyId) {
      return Response.json({ messages: [], unreadCount: 0 });
    }

    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("id,title")
      .eq("company_id", dbUser.companyId);

    if (eventsError) {
      return Response.json({ error: eventsError.message }, { status: 500 });
    }

    const eventIds = (events ?? []).map((event) => event.id);
    if (eventIds.length === 0) {
      return Response.json({ messages: [], unreadCount: 0 });
    }

    const { data: rows, error: messagesError } = await supabase
      .from("visitor_messages")
      .select("id,event_id,guest_email,guest_name,subject,body,is_read,admin_reply,replied_at,created_at")
      .in("event_id", eventIds)
      .order("created_at", { ascending: false })
      .limit(200);

    if (messagesError) {
      return Response.json({ error: messagesError.message }, { status: 500 });
    }

    const eventTitleMap = new Map((events ?? []).map((event) => [event.id, event.title]));

    const messages = (rows ?? []).map((row) => ({
      id: row.id,
      eventId: row.event_id,
      eventName: eventTitleMap.get(row.event_id) ?? null,
      guestEmail: row.guest_email,
      guestName: row.guest_name,
      subject: row.subject,
      body: row.body,
      isRead: row.is_read,
      adminReply: row.admin_reply,
      repliedAt: row.replied_at,
      createdAt: row.created_at,
    }));

    const unreadCount = messages.filter((m) => !m.isRead && !m.adminReply).length;

    return Response.json({ messages, unreadCount });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : "Failed",
    }, { status: 500 });
  }
}
