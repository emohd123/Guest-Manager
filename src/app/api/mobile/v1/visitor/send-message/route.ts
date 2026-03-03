export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "../../utils";
import { createClient } from "@supabase/supabase-js";
import { getDb } from "@/server/db";
import { events as eventsTable } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

const bodySchema = z.object({
  eventCode: z.string().min(4).max(12),
  subject: z.string().min(1).max(200).default("Question about the event"),
  body: z.string().min(1).max(2000),
});

function getBearerToken(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : null;
}

/**
 * POST /api/mobile/v1/visitor/send-message
 * Body: { eventCode, subject, body }
 * Visitor sends a message to the event organizer.
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

    const parsed = bodySchema.parse(await request.json());
    const email = userData.user.email;
    const meta = userData.user.user_metadata as { name?: string; firstName?: string; lastName?: string } | undefined;
    const guestName =
      meta?.name ??
      [meta?.firstName, meta?.lastName].filter(Boolean).join(" ") ??
      email.split("@")[0];

    const db = getDb();

    // Find event by code
    const eventRows = await db
      .select({ id: eventsTable.id, title: eventsTable.title })
      .from(eventsTable)
      .where(eq(eventsTable.visitorCode, parsed.eventCode.trim().toUpperCase()))
      .limit(1);

    if (!eventRows.length) {
      return jsonError("Event code not found.", 404, "event_not_found");
    }

    const event = eventRows[0];

    await db.execute(sql`
      INSERT INTO visitor_messages (event_id, guest_email, guest_name, subject, body)
      VALUES (${event.id}, ${email}, ${guestName}, ${parsed.subject}, ${parsed.body})
    `);

    return NextResponse.json({
      success: true,
      message: `Your message has been sent to the organizer of "${event.title}".`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Invalid input", 400, "validation_failed");
    }
    return jsonError(
      error instanceof Error ? error.message : "Failed to send message",
      500,
      "send_failed"
    );
  }
}
