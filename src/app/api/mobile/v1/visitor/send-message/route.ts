export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "../../utils";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { createEventNotifications } from "@/server/actions/createEventNotifications";

const bodySchema = z.object({
  eventCode: z.string().min(4).max(12),
  subject: z.string().min(1).max(200).default("Question about the event"),
  body: z.string().min(1).max(2000),
});

function getBearerToken(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : null;
}

export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    if (!token) return jsonError("Missing bearer token", 401, "unauthorized");
    const parsed = bodySchema.parse(await request.json());

    const supabase = createSupabaseAdminClient();
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user?.email) {
      return jsonError("Invalid or expired token", 401, "unauthorized");
    }

    const email = userData.user.email;
    const meta = userData.user.user_metadata as { name?: string; firstName?: string; lastName?: string } | undefined;
    const guestName =
      meta?.name ??
      [meta?.firstName, meta?.lastName].filter(Boolean).join(" ") ??
      email.split("@")[0];

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id,title")
      .eq("visitor_code", parsed.eventCode.trim().toUpperCase())
      .maybeSingle();

    if (eventError) {
      return jsonError(eventError.message, 500, "event_not_found");
    }
    if (!event) {
      return jsonError("Event code not found.", 404, "event_not_found");
    }

    const { error: insertError } = await supabase.from("visitor_messages").insert({
      event_id: event.id,
      guest_email: email,
      guest_name: guestName,
      subject: parsed.subject,
      body: parsed.body,
    });

    if (insertError) {
      return jsonError(insertError.message, 500, "send_failed");
    }

    await createEventNotifications({
      eventId: event.id,
      title: "New attendee message",
      body: `${guestName} sent a message from the attendee app.`,
      type: "message_reply",
    });

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
