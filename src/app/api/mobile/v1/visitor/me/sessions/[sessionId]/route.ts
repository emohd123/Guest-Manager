export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateVisitorSessionState } from "@/server/services/event-app";
import { jsonError } from "../../../../utils";

const bodySchema = z.object({
  eventId: z.string().uuid(),
  action: z.enum(["save", "unsave", "plan", "unplan", "view", "live_open"]),
});

function getBearerToken(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const token = getBearerToken(request);
    if (!token) return jsonError("Missing bearer token", 401, "unauthorized");
    const { sessionId } = await params;
    const parsed = bodySchema.parse(await request.json());
    const state = await updateVisitorSessionState(token, parsed.eventId, sessionId, parsed.action);
    return NextResponse.json({ success: true, state });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Invalid input", 400, "validation_failed");
    }
    return jsonError(error instanceof Error ? error.message : "Failed to update session", 500, "save_failed");
  }
}
