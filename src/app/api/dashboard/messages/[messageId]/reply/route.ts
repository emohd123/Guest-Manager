export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { getDb } from "@/server/db";
import { sql } from "drizzle-orm";
import { createEventNotifications } from "@/server/actions/createEventNotifications";

interface RouteParams {
  params: { messageId: string };
}

/**
 * POST /api/dashboard/messages/[messageId]/reply
 * Body: { reply: string }
 * Organizer replies to a guest message.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { reply } = (await request.json()) as { reply?: string };
    if (!reply?.trim()) {
      return Response.json({ error: "Reply cannot be empty" }, { status: 400 });
    }

    const db = getDb();
    const { messageId } = params;

    // Fetch the message
    const msgRows = (await db.execute(sql`
      SELECT id, event_id, guest_email, guest_name, subject
      FROM visitor_messages
      WHERE id = ${messageId}
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

    // Write reply to the message row
    await db.execute(sql`
      UPDATE visitor_messages
      SET admin_reply = ${reply.trim()},
          replied_at  = now(),
          is_read     = true
      WHERE id = ${messageId}
    `);

    // Create in-app notification for the guest
    await createEventNotifications({
      eventId: msg.event_id,
      title: "Reply from event organizer",
      body: reply.trim().slice(0, 200) + (reply.trim().length > 200 ? "…" : ""),
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
