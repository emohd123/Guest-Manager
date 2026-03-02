export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { ackDeviceCommand, getBearerToken, validateDeviceToken } from "@/server/services/checkin";
import { ensureMobileV2Enabled, jsonError } from "../../../../utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    ensureMobileV2Enabled();
    const { id } = await params;
    const db = getDb();
    const token = getBearerToken(request);
    if (!token) return jsonError("Missing bearer token", 401, "unauthorized");
    const claims = await validateDeviceToken(db, token);
    if (!claims) return jsonError("Invalid device token", 401, "unauthorized");

    const command = await ackDeviceCommand(db, claims, id);
    return NextResponse.json({ success: true, command });
  } catch (error) {
    if (error instanceof Error && error.message === "CHECKIN_APP_V2_DISABLED") {
      return jsonError("Mobile v2 is disabled", 404, "feature_disabled");
    }
    return jsonError(error instanceof Error ? error.message : "Unable to acknowledge command", 400, "command_ack_failed");
  }
}

