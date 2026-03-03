export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

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

    const db = getDb();

    // Get companyId from the users table (same pattern as tRPC context)
    const [dbUser] = await db
      .select({ companyId: users.companyId })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!dbUser?.companyId) {
      return Response.json({ messages: [], unreadCount: 0 });
    }

    const companyId = dbUser.companyId;

    const rows = (await db.execute(sql`
      SELECT m.id, m.event_id, e.title AS event_title,
             m.guest_email, m.guest_name, m.subject, m.body,
             m.is_read, m.admin_reply, m.replied_at, m.created_at
      FROM visitor_messages m
      JOIN events e ON e.id = m.event_id
      WHERE e.company_id = ${companyId}
      ORDER BY m.created_at DESC
      LIMIT 200
    `)) as Array<{
      id: string;
      event_id: string;
      event_title: string | null;
      guest_email: string;
      guest_name: string | null;
      subject: string | null;
      body: string;
      is_read: boolean;
      admin_reply: string | null;
      replied_at: string | null;
      created_at: string;
    }>;

    const messages = rows.map((r) => ({
      id: r.id,
      eventId: r.event_id,
      eventName: r.event_title,
      guestEmail: r.guest_email,
      guestName: r.guest_name,
      subject: r.subject,
      body: r.body,
      isRead: r.is_read,
      adminReply: r.admin_reply,
      repliedAt: r.replied_at,
      createdAt: r.created_at,
    }));

    const unreadCount = messages.filter((m) => !m.isRead && !m.adminReply).length;

    return Response.json({ messages, unreadCount });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : "Failed",
    }, { status: 500 });
  }
}
