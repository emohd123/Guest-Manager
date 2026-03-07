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
      .from("visitor_messages")
      .select("id,event_id,subject,body,admin_reply,replied_at,created_at,events(title)")
      .eq("guest_email", email)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return jsonError(error.message, 500, "fetch_failed");
    }

    const messages = (data ?? []).map((row: any) => ({
      id: row.id,
      eventId: row.event_id,
      eventName: row.events?.title ?? null,
      subject: row.subject,
      body: row.body,
      adminReply: row.admin_reply,
      repliedAt: row.replied_at,
      createdAt: row.created_at,
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
