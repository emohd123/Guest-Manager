export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "../../../../../utils";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { confirmGuestAttendance } from "@/server/guests/attendance";

function getBearerToken(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const token = getBearerToken(request);
    if (!token) return jsonError("Missing bearer token", 401, "unauthorized");

    const { eventId } = await params;
    const supabase = createSupabaseAdminClient();
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user?.email) {
      return jsonError("Invalid or expired token", 401, "unauthorized");
    }

    const { data: guestData, error: guestError } = await supabase
      .from("guests")
      .select("id")
      .eq("event_id", eventId)
      .eq("email", userData.user.email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (guestError) {
      return jsonError(guestError.message, 500, "confirmation_failed");
    }

    if (!guestData?.id) {
      return jsonError("No invitation found for this event.", 404, "guest_not_found");
    }

    const updatedGuest = await confirmGuestAttendance(supabase, {
      guestId: guestData.id,
      eventId,
      email: userData.user.email,
    });

    return NextResponse.json({
      success: true,
      confirmation: {
        guestId: updatedGuest.id,
        eventId: updatedGuest.event_id,
        rsvpStatus: updatedGuest.rsvp_status,
        rsvpAt: updatedGuest.rsvp_at,
        status: updatedGuest.status,
      },
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to confirm attendance",
      500,
      "confirmation_failed"
    );
  }
}
