export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getVisitorChatData, sendVisitorChatMessage } from "@/server/services/event-app";
import { jsonError } from "../../../utils";

const bodySchema = z.object({
  eventId: z.string().uuid(),
  body: z.string().min(1).max(1000),
  threadId: z.string().uuid().optional(),
  targetGuestId: z.string().uuid().optional(),
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
    const data = await getVisitorChatData(token, eventId);
    return NextResponse.json(data);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to load chat", 500, "fetch_failed");
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    if (!token) return jsonError("Missing bearer token", 401, "unauthorized");
    const parsed = bodySchema.parse(await request.json());
    const result = await sendVisitorChatMessage(token, parsed.eventId, parsed.body, {
      threadId: parsed.threadId,
      targetGuestId: parsed.targetGuestId,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Invalid input", 400, "validation_failed");
    }
    return jsonError(error instanceof Error ? error.message : "Failed to send chat", 500, "save_failed");
  }
}
