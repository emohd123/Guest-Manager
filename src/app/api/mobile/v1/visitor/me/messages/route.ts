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
 * GET /api/mobile/v1/visitor/me/messages
 * Returns all messages the visitor has sent, with any admin replies.
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

    const rows = (await db.execute(sql`
      SELECT m.id, m.event_id, e.title AS event_title,
             m.subject, m.body, m.admin_reply, m.replied_at, m.created_at
      FROM visitor_messages m
      LEFT JOIN events e ON e.id = m.event_id
      WHERE m.guest_email = ${email}
      ORDER BY m.created_at DESC
      LIMIT 50
    `)) as Array<{
      id: string;
      event_id: string;
      event_title: string | null;
      subject: string | null;
      body: string;
      admin_reply: string | null;
      replied_at: string | null;
      created_at: string;
    }>;

    const messages = rows.map((r) => ({
      id: r.id,
      eventId: r.event_id,
      eventName: r.event_title,
      subject: r.subject,
      body: r.body,
      adminReply: r.admin_reply,
      repliedAt: r.replied_at,
      createdAt: r.created_at,
    }));

    return NextResponse.json({ messages });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to fetch messages",
      500,
      "fetch_failed"
    );
  }
}
