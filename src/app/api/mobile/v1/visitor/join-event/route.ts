export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "../../utils";
import { createSupabaseAdminClient } from "@/server/supabase/admin";

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

    const supabase = createSupabaseAdminClient();
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user?.email) {
      return jsonError("Invalid or expired token", 401, "unauthorized");
    }

    const parsed = bodySchema.parse(await request.json());
    const normalizedCode = parsed.eventCode.trim().toUpperCase();

    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("id,title,starts_at,visitor_code")
      .eq("visitor_code", normalizedCode)
      .maybeSingle();

    if (eventError) {
      return jsonError(eventError.message, 500, "join_failed");
    }

    if (!eventData) {
      return jsonError("Event code not found. Please check and try again.", 404, "code_not_found");
    }

    const { data: guestData, error: guestError } = await supabase
      .from("guests")
      .select("id")
      .eq("event_id", eventData.id)
      .eq("email", userData.user.email)
      .limit(1);

    if (guestError) {
      return jsonError(guestError.message, 500, "join_failed");
    }

    return NextResponse.json({
      event: {
        id: eventData.id,
        name: eventData.title,
        startsAt: eventData.starts_at,
        visitorCode: eventData.visitor_code,
      },
      guestFound: (guestData?.length ?? 0) > 0,
      message:
        (guestData?.length ?? 0) > 0
          ? `Connected to "${eventData.title}" successfully!`
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
