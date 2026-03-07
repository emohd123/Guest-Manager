export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getEventExperience, getVisitorGuestContext } from "@/server/services/event-app";
import { jsonError } from "../../../utils";

function getBearerToken(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : null;
}

export async function GET(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    if (!token) return jsonError("Missing bearer token", 401, "unauthorized");
    const eventId = request.nextUrl.searchParams.get("eventId");
    if (!eventId) return jsonError("Missing eventId", 400, "validation_failed");

    const ctx = await getVisitorGuestContext(token, eventId);
    const experience = await getEventExperience(ctx.event.id);
    const profile = ctx.guest.custom_data?.eventApp?.networkingProfile ?? {};

    const sessions = experience.sessions.map((session) => ({
      ...session,
      isSaved: Array.isArray(profile.savedSessionIds) ? profile.savedSessionIds.includes(session.id) : false,
      isPlanned: Array.isArray(profile.plannedSessionIds) ? profile.plannedSessionIds.includes(session.id) : false,
    }));

    return NextResponse.json({ sessions, settings: experience.settings });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to load sessions", 500, "fetch_failed");
  }
}
