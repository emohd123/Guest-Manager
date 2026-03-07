export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createNetworkingRequest, getVisitorNetworkingData } from "@/server/services/event-app";
import { jsonError } from "../../../utils";

const requestSchema = z.object({
  eventId: z.string().uuid(),
  targetGuestId: z.string().uuid(),
  message: z.string().max(280).optional(),
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
    const data = await getVisitorNetworkingData(token, eventId);
    return NextResponse.json(data);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to load networking", 500, "fetch_failed");
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    if (!token) return jsonError("Missing bearer token", 401, "unauthorized");
    const parsed = requestSchema.parse(await request.json());
    const result = await createNetworkingRequest(token, parsed.eventId, parsed.targetGuestId, parsed.message);
    return NextResponse.json({ request: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Invalid input", 400, "validation_failed");
    }
    return jsonError(error instanceof Error ? error.message : "Failed to send request", 500, "save_failed");
  }
}
