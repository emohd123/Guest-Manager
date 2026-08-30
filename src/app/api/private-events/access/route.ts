export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { isRateLimited, registerAttempt } from "@/server/services/checkin/rate-limit";
import { createPrivateEventAccess, privateEventAccessCookie } from "@/server/services/private-event-access";

const bodySchema = z.object({
  username: z.string().trim().min(2).max(120),
  eventCode: z.string().trim().regex(/^[A-Za-z0-9-]{4,10}$/),
  eventId: z.string().uuid(),
});

function getRequestIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown";
}

function normalizeUsername(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export async function POST(request: NextRequest) {
  const ip = getRequestIp(request);

  try {
    const input = bodySchema.parse(await request.json());
    const eventCode = input.eventCode.toUpperCase();
    const rateLimitKey = `private-event:${ip}:${eventCode}`;

    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json({ error: "Too many attempts. Please try again shortly." }, { status: 429 });
    }

    const supabase = createSupabaseAdminClient();
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id,company_id,slug,settings,ends_at")
      .eq("visitor_code", eventCode)
      .eq("event_type", "conference")
      .eq("status", "published")
      .is("deleted_at", null)
      .maybeSingle();

    if (eventError) throw new Error(eventError.message);

    const publicPageEnabled =
      event?.settings && typeof event.settings === "object"
        ? (event.settings as { publicPage?: { enabled?: boolean } }).publicPage?.enabled !== false
        : true;

    if (!event || event.id !== input.eventId || !publicPageEnabled) {
      registerAttempt(rateLimitKey, false);
      return NextResponse.json({ error: "The username or event code is not valid." }, { status: 401 });
    }

    const { data: guests, error: guestError } = await supabase
      .from("guests")
      .select("id,first_name,last_name")
      .eq("event_id", event.id);

    if (guestError) throw new Error(guestError.message);

    const enteredUsername = normalizeUsername(input.username);
    const matchingGuest = (guests ?? []).find((guest) =>
      normalizeUsername(`${guest.first_name ?? ""} ${guest.last_name ?? ""}`) === enteredUsername
    );

    if (!matchingGuest) {
      registerAttempt(rateLimitKey, false);
      return NextResponse.json({ error: "The username or event code is not valid." }, { status: 401 });
    }

    const access = createPrivateEventAccess({
      eventId: event.id,
      guestId: matchingGuest.id,
      username: input.username.trim(),
    }, event.ends_at);
    const response = NextResponse.json({ portalUrl: `/private-event/portal/${event.id}` });
    response.cookies.set(privateEventAccessCookie.name, access.token, { ...privateEventAccessCookie.options, maxAge: access.maxAge });
    registerAttempt(rateLimitKey, true);
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Enter your username and a valid event code." }, { status: 400 });
    }
    return NextResponse.json({ error: "We could not verify the event code. Please try again." }, { status: 500 });
  }
}
