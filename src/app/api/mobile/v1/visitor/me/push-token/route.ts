export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { registerVisitorPushToken } from "@/server/services/event-app";
import { jsonError } from "../../../utils";

const bodySchema = z.object({
  eventId: z.string().uuid(),
  token: z.string().min(8),
  platform: z.string().min(2).max(20),
});

function getBearerToken(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : null;
}

export async function POST(request: NextRequest) {
  try {
    const authToken = getBearerToken(request);
    if (!authToken) return jsonError("Missing bearer token", 401, "unauthorized");
    const parsed = bodySchema.parse(await request.json());
    const result = await registerVisitorPushToken(authToken, parsed.eventId, parsed.token, parsed.platform);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Invalid input", 400, "validation_failed");
    }
    return jsonError(error instanceof Error ? error.message : "Failed to register push token", 500, "save_failed");
  }
}
