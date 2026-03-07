export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/server/db";
import { getBearerToken, heartbeatDevice, validateDeviceToken } from "@/server/services/checkin";
import { ensureMobileV2Enabled, jsonError } from "../../utils";

const bodySchema = z.object({
  battery: z.number().int().min(0).max(100).optional(),
  scannerBattery: z.number().int().min(0).max(100).optional(),
  scannerChargeState: z.string().max(40).optional(),
  appVersion: z.string().max(40).optional(),
  station: z.string().max(120).optional(),
  lastSyncAt: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    ensureMobileV2Enabled();
    const parsed = bodySchema.parse(await request.json());
    const db = getDb();
    const token = getBearerToken(request);
    if (!token) return jsonError("Missing bearer token", 401, "unauthorized");
    const claims = await validateDeviceToken(db, token);
    if (!claims) return jsonError("Invalid device token", 401, "unauthorized");

    const result = await heartbeatDevice(db, claims, parsed);
    return NextResponse.json({ success: true, device: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Invalid request body", 400, "validation_failed");
    }
    if (error instanceof Error && error.message === "CHECKIN_APP_V2_DISABLED") {
      return jsonError("Mobile v2 is disabled", 404, "feature_disabled");
    }
    return jsonError(error instanceof Error ? error.message : "Unable to process heartbeat", 400, "heartbeat_failed");
  }
}

