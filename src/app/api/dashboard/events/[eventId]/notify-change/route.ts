export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { ensureAppUserForAuthUser } from "@/server/auth/app-user";
import {
  createEventNotifications,
  type NotificationType,
} from "@/server/actions/createEventNotifications";

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await ensureAppUserForAuthUser(supabase, user);
    if (!dbUser?.companyId) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (dbUser.dashboardAccess !== "full") return Response.json({ error: "Full dashboard access is required to send notifications." }, { status: 403 });

    const { eventId } = await params;
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .eq("company_id", dbUser.companyId)
      .maybeSingle();

    if (eventError) {
      return Response.json({ error: eventError.message }, { status: 500 });
    }

    if (!event) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    const { type, title, body } = (await request.json()) as {
      type?: NotificationType;
      title?: string;
      body?: string;
    };

    if (typeof type !== "string" || typeof title !== "string" || typeof body !== "string" || !title.trim() || !body.trim() || !["event_update", "agenda_update", "message_reply", "networking_request", "networking_accept", "meeting_update", "session_reminder", "live_stream", "chat_message"].includes(type)) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    if (title.length > 150 || body.length > 1500) return Response.json({ error: "Keep the title under 150 characters and message under 1500." }, { status: 400 });
    const result = await createEventNotifications({ eventId, title, body, type });
    if (!result) return Response.json({ error: "The notification could not be saved. Please retry." }, { status: 503 });

    return Response.json({ success: true, ...result });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed",
      },
      { status: 500 }
    );
  }
}
