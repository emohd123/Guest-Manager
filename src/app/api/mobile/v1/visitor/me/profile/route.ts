export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getVisitorGuestContext,
  getVisitorNetworkingData,
  updateVisitorNetworkingProfile,
} from "@/server/services/event-app";
import { jsonError } from "../../../utils";

const profileSchema = z.object({
  eventId: z.string().uuid(),
  optedIn: z.boolean().optional(),
  visible: z.boolean().optional(),
  headline: z.string().optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  bio: z.string().optional(),
  profileImageUrl: z.string().optional(),
  interests: z.array(z.string()).optional(),
  goals: z.array(z.string()).optional(),
  industries: z.array(z.string()).optional(),
  availability: z.string().optional(),
  contactSharing: z
    .object({
      email: z.boolean().optional(),
      phone: z.boolean().optional(),
    })
    .optional(),
});

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
    const networking = await getVisitorNetworkingData(token, eventId);
    return NextResponse.json({
      guestId: ctx.guest.id,
      profile: networking.profile,
      eventId: ctx.event.id,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to load profile", 500, "fetch_failed");
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    if (!token) return jsonError("Missing bearer token", 401, "unauthorized");
    const parsed = profileSchema.parse(await request.json());
    const profile = await updateVisitorNetworkingProfile(token, parsed.eventId, {
      optedIn: parsed.optedIn,
      visible: parsed.visible,
      headline: parsed.headline,
      company: parsed.company,
      role: parsed.role,
      bio: parsed.bio,
      profileImageUrl: parsed.profileImageUrl,
      interests: parsed.interests,
      goals: parsed.goals,
      industries: parsed.industries,
      availability: parsed.availability,
      contactSharing: parsed.contactSharing
        ? {
            email: parsed.contactSharing.email ?? true,
            phone: parsed.contactSharing.phone ?? false,
          }
        : undefined,
    });
    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Invalid input", 400, "validation_failed");
    }
    return jsonError(error instanceof Error ? error.message : "Failed to save profile", 500, "save_failed");
  }
}
