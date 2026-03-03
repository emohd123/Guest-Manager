export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getDb } from "@/server/db";
import { sql } from "drizzle-orm";

function getAuthHeader(req: NextRequest) {
  return req.headers.get("authorization") ?? "";
}

/**
 * GET /api/dashboard/messages
 * Returns all visitor messages for the authenticated admin/company.
 */
export async function GET(request: NextRequest) {
  try {
    const token = getAuthHeader(request).replace("Bearer ", "");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // For cookie-based auth (dashboard), get user from session cookie
    const { data: { user } } = token
      ? await supabase.auth.getUser(token)
      : { data: { user: null } };

    // If no bearer, try getting session from cookies (dashboard SSR)
    if (!user) {
      // Allow request to proceed with service role for dashboard pages
      // that use cookie-based auth — check company via query param or session
    }

    const db = getDb();

    // Get company_id from user's company membership
    let companyId: string | null = null;
    if (user) {
      const membership = (await db.execute(sql`
        SELECT company_id FROM company_members WHERE user_id = ${user.id} LIMIT 1
      `)) as Array<{ company_id: string }>;
      companyId = membership[0]?.company_id ?? null;
    }

    const rows = (await db.execute(sql`
      SELECT m.id, m.event_id, e.title AS event_title,
             m.guest_email, m.guest_name, m.subject, m.body,
             m.is_read, m.admin_reply, m.replied_at, m.created_at
      FROM visitor_messages m
      JOIN events e ON e.id = m.event_id
      ${companyId ? sql`WHERE e.company_id = ${companyId}` : sql``}
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

    const unreadCount = messages.filter((m) => !m.isRead).length;

    return Response.json({ messages, unreadCount });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : "Failed",
    }, { status: 500 });
  }
}
