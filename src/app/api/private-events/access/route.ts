export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { isRateLimited, registerAttempt } from "@/server/services/checkin/rate-limit";
import { createPrivateEventAccess, privateEventAccessCookie } from "@/server/services/private-event-access";
import { getEventExperience } from "@/server/services/event-app";

const bodySchema = z.object({
  username: z.string().trim().min(2).max(120),
  eventCode: z.string().trim().regex(/^[A-Za-z0-9-]{4,10}$/),
  role: z.enum(["attendee", "speaker"]).optional().default("attendee"),
  // The browser can send the selected conference id as an extra safeguard.
  // Native clients only know the code, so the code itself is the authority.
  eventId: z.string().uuid().optional(),
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
    const eventLookup = supabase
      .from("events")
      .select("id,company_id,slug,settings,ends_at")
      .eq("event_type", "conference")
      .eq("status", "published")
      .is("deleted_at", null);
    const { data: event, error: eventError } = input.role === "speaker" && input.eventId
      ? await eventLookup.eq("id", input.eventId).maybeSingle()
      : await eventLookup.eq("visitor_code", eventCode).maybeSingle();

    if (eventError) throw new Error(eventError.message);

    const publicPageEnabled =
      event?.settings && typeof event.settings === "object"
        ? (event.settings as { publicPage?: { enabled?: boolean } }).publicPage?.enabled !== false
        : true;

    if (!event || (input.eventId && event.id !== input.eventId) || !publicPageEnabled) {
      registerAttempt(rateLimitKey, false);
      return NextResponse.json({ error: "The username or event code is not valid." }, { status: 401 });
    }

    if (input.role === "speaker") {
      const experience = await getEventExperience(event.id);
      const speakerSessions = experience.sessions.filter((session) =>
        normalizeUsername(session.speaker ?? "") === normalizeUsername(input.username)
        && session.speakerAccessCode === eventCode
      );
      if (speakerSessions.length === 0) {
        registerAttempt(rateLimitKey, false);
        return NextResponse.json({ error: "The speaker name or access code is not valid." }, { status: 401 });
      }
      const speakerName = speakerSessions[0].speaker ?? input.username.trim();
      const access = createPrivateEventAccess({
        eventId: event.id,
        guestId: speakerSessions[0].id,
        username: input.username.trim(),
        role: "speaker",
        speakerName,
      }, event.ends_at);
      const response = NextResponse.json({
        portalUrl: `/private-event/speaker-portal/${event.id}`,
        accessToken: access.token,
        expiresAt: new Date(access.maxAge * 1000 + Date.now()).toISOString(),
        eventId: event.id,
        username: input.username.trim(),
        role: "speaker",
      });
      response.cookies.set(privateEventAccessCookie.name, access.token, { ...privateEventAccessCookie.options, maxAge: access.maxAge });
      registerAttempt(rateLimitKey, true);
      return response;
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
    // The browser keeps this in an HttpOnly cookie. The native app must retain
    // the same short-lived, event-scoped token in its platform secure storage.
    const response = NextResponse.json({
      portalUrl: `/private-event/portal/${event.id}`,
      accessToken: access.token,
      expiresAt: new Date(access.maxAge * 1000 + Date.now()).toISOString(),
      eventId: event.id,
      guestId: matchingGuest.id,
      username: input.username.trim(),
    });
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
