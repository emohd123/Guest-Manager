export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { registerDiscoverPushToken } from "@/server/services/discover-push";
import { jsonError } from "../../utils";

// Public endpoint: the Discover marketplace runs pre-auth, so registration is
// open — tokens are opaque Expo identifiers and only ever receive broadcasts.
const bodySchema = z.object({
  token: z.string().min(8).max(200).startsWith("ExponentPushToken"),
  platform: z.string().min(2).max(20).optional(),
  installationId: z.string().min(4).max(80).optional(),
  categories: z.array(z.string().min(1).max(40)).max(10).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = bodySchema.parse(await request.json());
    await registerDiscoverPushToken(parsed);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Invalid input", 400, "validation_failed");
    }
    return jsonError(
      error instanceof Error ? error.message : "Failed to register push token",
      500,
      "save_failed"
    );
  }
}
