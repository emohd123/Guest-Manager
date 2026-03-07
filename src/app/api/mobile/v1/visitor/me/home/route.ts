export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getEventExperience, getVisitorGuestContext, getVisitorNetworkingData } from "@/server/services/event-app";
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
    const ctx = await getVisitorGuestContext(token, eventId);
    const experience = await getEventExperience(ctx.event.id);
    const networking = await getVisitorNetworkingData(token, ctx.event.id);
    const now = Date.now();
    const sessions = experience.sessions;
    const nextSession =
      sessions.find((session) => session.startsAt && new Date(session.startsAt).getTime() >= now) ?? null;
    const liveSession =
      sessions.find((session) => session.liveNow || session.status === "live") ?? null;

    return NextResponse.json({
      event: {
        id: ctx.event.id,
        title: ctx.event.title,
        description: ctx.event.description,
        shortDescription: ctx.event.short_description,
        coverImageUrl: ctx.event.cover_image_url,
        startsAt: ctx.event.starts_at,
        endsAt: ctx.event.ends_at,
        visitorCode: ctx.event.visitor_code,
      },
      settings: experience.settings,
      nextSession,
      liveSession,
      announcements: experience.settings.announcements,
      networking: {
        optedIn: networking.profile.optedIn,
        visible: networking.profile.visible,
        recommendationCount: networking.recommendations.length,
        pendingRequestCount: networking.requests.filter((request) => request.status === "pending").length,
        meetingsCount: networking.meetings.length,
      },
      featuredSponsors: networking.featuredSponsors,
      profile: networking.profile,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to load home data",
      500,
      "fetch_failed"
    );
  }
}
