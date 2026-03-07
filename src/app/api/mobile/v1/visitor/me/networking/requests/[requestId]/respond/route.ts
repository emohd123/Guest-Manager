export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { respondToNetworkingRequest } from "@/server/services/event-app";
import { jsonError } from "../../../../../../utils";

const bodySchema = z.object({
  eventId: z.string().uuid(),
  status: z.enum(["accepted", "declined"]),
  scheduledFor: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

function getBearerToken(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const token = getBearerToken(request);
    if (!token) return jsonError("Missing bearer token", 401, "unauthorized");
    const { requestId } = await params;
    const parsed = bodySchema.parse(await request.json());
    const result = await respondToNetworkingRequest(
      token,
      parsed.eventId,
      requestId,
      parsed.status,
      parsed.scheduledFor,
      parsed.location,
      parsed.notes
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Invalid input", 400, "validation_failed");
    }
    return jsonError(error instanceof Error ? error.message : "Failed to respond", 500, "save_failed");
  }
}
