export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { createEventNotifications } from "@/server/actions/createEventNotifications";

interface RouteParams {
  params: Promise<{ messageId: string }>;
}

/**
 * POST /api/dashboard/messages/[messageId]/reply
 * Body: { reply: string }
 * Organizer replies to a guest message.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Auth check via cookie session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();

    // Verify user has a companyId
    const [dbUser] = await db
      .select({ companyId: users.companyId })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!dbUser?.companyId) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { reply } = (await request.json()) as { reply?: string };
    if (!reply?.trim()) {
      return Response.json({ error: "Reply cannot be empty" }, { status: 400 });
    }

    const { messageId } = await params;

    // Fetch the message — ensure it belongs to this company
    const msgRows = (await db.execute(sql`
      SELECT m.id, m.event_id, m.guest_email, m.guest_name, m.subject
      FROM visitor_messages m
      JOIN events e ON e.id = m.event_id
      WHERE m.id = ${messageId}
        AND e.company_id = ${dbUser.companyId}
      LIMIT 1
    `)) as Array<{
      id: string;
      event_id: string;
      guest_email: string;
      guest_name: string | null;
      subject: string | null;
    }>;

    if (!msgRows.length) {
      return Response.json({ error: "Message not found" }, { status: 404 });
    }

    const msg = msgRows[0];

    // Write reply
    await db.execute(sql`
      UPDATE visitor_messages
      SET admin_reply = ${reply.trim()},
          replied_at  = now(),
          is_read     = true
      WHERE id = ${messageId}
    `);

    // Create in-app notification for the guest
    const replyPreview = reply.trim().length > 200
      ? reply.trim().slice(0, 200) + "…"
      : reply.trim();

    await createEventNotifications({
      eventId: msg.event_id,
      title: "Reply from event organizer",
      body: replyPreview,
      type: "message_reply",
      recipientEmail: msg.guest_email,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : "Failed",
    }, { status: 500 });
  }
}
