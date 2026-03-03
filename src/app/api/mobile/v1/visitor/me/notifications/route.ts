export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "../../../utils";
import { createClient } from "@supabase/supabase-js";
import { getDb } from "@/server/db";
import { tickets as ticketsTable } from "@/server/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import { sql } from "drizzle-orm";

function getBearerToken(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : null;
}

/**
 * GET /api/mobile/v1/visitor/me/notifications
 * Returns in-app notifications for the logged-in visitor.
 */
export async function GET(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    if (!token) return jsonError("Missing bearer token", 401, "unauthorized");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user?.email) {
      return jsonError("Invalid or expired token", 401, "unauthorized");
    }

    const email = userData.user.email;
    const db = getDb();

    // Get all event IDs where this visitor has a ticket
    const ticketRows = await db
      .selectDistinct({ eventId: ticketsTable.eventId })
      .from(ticketsTable)
      .where(
        and(
          eq(ticketsTable.attendeeEmail, email),
          isNotNull(ticketsTable.eventId)
        )
      );

    const eventIds = ticketRows.map((t) => t.eventId).filter(Boolean) as string[];

    let rows: Array<{
      id: string;
      event_id: string;
      event_title: string | null;
      recipient_email: string | null;
      title: string;
      body: string;
      type: string;
      is_read: boolean;
      created_at: string;
    }>;

    if (eventIds.length > 0) {
      // Fetch targeted + broadcast notifications for events the visitor has tickets for
      rows = (await db.execute(sql`
        SELECT n.id, n.event_id, n.recipient_email, n.title, n.body, n.type, n.is_read, n.created_at,
               e.title AS event_title
        FROM visitor_notifications n
        LEFT JOIN events e ON e.id = n.event_id
        WHERE n.recipient_email = ${email}
           OR (n.recipient_email IS NULL AND n.event_id = ANY(${eventIds}::uuid[]))
        ORDER BY n.created_at DESC
        LIMIT 50
      `)) as typeof rows;
    } else {
      // Only targeted notifications (no ticket-based events found)
      rows = (await db.execute(sql`
        SELECT n.id, n.event_id, n.recipient_email, n.title, n.body, n.type, n.is_read, n.created_at,
               e.title AS event_title
        FROM visitor_notifications n
        LEFT JOIN events e ON e.id = n.event_id
        WHERE n.recipient_email = ${email}
        ORDER BY n.created_at DESC
        LIMIT 50
      `)) as typeof rows;
    }

    const notifications = rows.map((r) => ({
      id: r.id,
      eventId: r.event_id,
      eventName: r.event_title ?? null,
      title: r.title,
      body: r.body,
      message: r.body, // backwards compat
      type: r.type,
      isRead: r.is_read,
      createdAt: r.created_at,
    }));

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to fetch notifications",
      500,
      "fetch_failed"
    );
  }
}

/**
 * POST /api/mobile/v1/visitor/me/notifications
 * Body: {} — marks all the visitor's notifications as read.
 */
export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    if (!token) return jsonError("Missing bearer token", 401, "unauthorized");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user?.email) {
      return jsonError("Invalid or expired token", 401, "unauthorized");
    }

    const email = userData.user.email;
    const db = getDb();

    await db.execute(sql`
      UPDATE visitor_notifications
      SET is_read = true
      WHERE recipient_email = ${email} AND is_read = false
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to mark read",
      500,
      "update_failed"
    );
  }
}
