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

    if (!type || !title || !body) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    await createEventNotifications({ eventId, title, body, type });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed",
      },
      { status: 500 }
    );
  }
}
