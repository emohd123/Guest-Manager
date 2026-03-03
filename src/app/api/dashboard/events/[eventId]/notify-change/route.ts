export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createEventNotifications, type NotificationType } from "@/server/actions/createEventNotifications";

/**
 * POST /api/dashboard/events/[eventId]/notify-change
 * Called after saving event/agenda changes so attendees receive an in-app notification.
 * Body: { type: "event_update" | "agenda_update", title: string, body: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    // Auth check via cookie/Authorization header
    const authHeader = request.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { type, title, body } = (await request.json()) as {
      type?: NotificationType;
      title?: string;
      body?: string;
    };

    if (!type || !title || !body) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    await createEventNotifications({
      eventId: params.eventId,
      title,
      body,
      type,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : "Failed",
    }, { status: 500 });
  }
}
