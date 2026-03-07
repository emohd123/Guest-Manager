export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "../../../utils";
import { createSupabaseAdminClient } from "@/server/supabase/admin";

function getBearerToken(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : null;
}

export async function GET(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    if (!token) return jsonError("Missing bearer token", 401, "unauthorized");

    const supabase = createSupabaseAdminClient();
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user?.email) {
      return jsonError("Invalid or expired token", 401, "unauthorized");
    }

    const email = userData.user.email;
    const { data, error } = await supabase
      .from("visitor_notifications")
      .select("id,event_id,recipient_email,title,body,type,is_read,created_at,events(title)")
      .or(`recipient_email.eq.${email},recipient_email.is.null`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return jsonError(error.message, 500, "fetch_failed");
    }

    const notifications = (data ?? []).map((row: any) => ({
      id: row.id,
      eventId: row.event_id,
      eventName: row.events?.title ?? null,
      title: row.title,
      body: row.body,
      message: row.body,
      type: row.type,
      isRead: row.is_read,
      createdAt: row.created_at,
    }));

    const unreadCount = notifications.filter((item) => !item.isRead).length;
    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to fetch notifications",
      500,
      "fetch_failed"
    );
  }
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

    const email = userData.user.email;
    const { error } = await supabase
      .from("visitor_notifications")
      .update({ is_read: true })
      .eq("recipient_email", email)
      .eq("is_read", false);

    if (error) {
      return jsonError(error.message, 500, "update_failed");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to update notifications",
      500,
      "update_failed"
    );
  }
}
