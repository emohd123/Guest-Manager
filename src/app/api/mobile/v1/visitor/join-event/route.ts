export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "../../utils";
import { createClient } from "@supabase/supabase-js";
import { getDb } from "@/server/db";
import { guests, events as eventsTable } from "@/server/db/schema";
import { eq } from "drizzle-orm";

const bodySchema = z.object({
  eventCode: z.string().min(4).max(12),
});

function getBearerToken(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : null;
}

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
    const db = getDb();

    // Find the event with this visitor code (case-insensitive)
    const eventRows = await db
      .select({
        id: eventsTable.id,
        title: eventsTable.title,
        startsAt: eventsTable.startsAt,
        visitorCode: eventsTable.visitorCode,
      })
      .from(eventsTable)
      .where(eq(eventsTable.visitorCode, parsed.eventCode.trim().toUpperCase()))
      .limit(1);

    if (!eventRows.length) {
      return jsonError("Event code not found. Please check and try again.", 404, "code_not_found");
    }

    const event = eventRows[0];

    // Find the visitor's guest record by email
    const guestRows = await db
      .select({ id: guests.id })
      .from(guests)
      .where(eq(guests.email, userData.user.email))
      .limit(1);

    return NextResponse.json({
      event: {
        id: event.id,
        name: event.title,
        startsAt: event.startsAt,
        visitorCode: event.visitorCode,
      },
      guestFound: guestRows.length > 0,
      message: guestRows.length > 0
        ? `Connected to "${event.title}" successfully!`
        : `Event found! Your ticket will appear once the organizer adds you.`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Invalid event code format", 400, "validation_failed");
    }
    return jsonError(
      error instanceof Error ? error.message : "Failed to join event",
      500,
      "join_failed"
    );
  }
}
