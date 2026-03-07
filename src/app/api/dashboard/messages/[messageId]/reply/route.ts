export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { ensureAppUserForAuthUser } from "@/server/auth/app-user";
import { createEventNotifications } from "@/server/actions/createEventNotifications";

interface RouteParams {
  params: Promise<{ messageId: string }>;
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

    const { reply } = (await request.json()) as { reply?: string };
    if (!reply?.trim()) {
      return Response.json({ error: "Reply cannot be empty" }, { status: 400 });
    }

    const { messageId } = await params;

    const { data: message, error: messageError } = await supabase
      .from("visitor_messages")
      .select("id,event_id,guest_email,guest_name,subject")
      .eq("id", messageId)
      .maybeSingle();

    if (messageError) {
      return Response.json({ error: messageError.message }, { status: 500 });
    }

    if (!message) {
      return Response.json({ error: "Message not found" }, { status: 404 });
    }

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id")
      .eq("id", message.event_id)
      .eq("company_id", dbUser.companyId)
      .maybeSingle();

    if (eventError) {
      return Response.json({ error: eventError.message }, { status: 500 });
    }

    if (!event) {
      return Response.json({ error: "Message not found" }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from("visitor_messages")
      .update({
        admin_reply: reply.trim(),
        replied_at: new Date().toISOString(),
        is_read: true,
      })
      .eq("id", messageId);

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    const replyPreview =
      reply.trim().length > 200 ? `${reply.trim().slice(0, 200)}...` : reply.trim();

    await createEventNotifications({
      eventId: message.event_id,
      title: "Reply from event organizer",
      body: replyPreview,
      type: "message_reply",
      recipientEmail: message.guest_email,
    });

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
