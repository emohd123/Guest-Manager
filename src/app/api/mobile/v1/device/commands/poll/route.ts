export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { getBearerToken, pollDeviceCommands, validateDeviceToken } from "@/server/services/checkin";
import { ensureMobileV2Enabled, jsonError } from "../../../utils";

export async function GET(request: NextRequest) {
  try {
    ensureMobileV2Enabled();
    const db = getDb();
    const token = getBearerToken(request);
    if (!token) return jsonError("Missing bearer token", 401, "unauthorized");
    const claims = await validateDeviceToken(db, token);
    if (!claims) return jsonError("Invalid device token", 401, "unauthorized");

    const commands = await pollDeviceCommands(db, claims);
    return NextResponse.json({ commands });
  } catch (error) {
    if (error instanceof Error && error.message === "CHECKIN_APP_V2_DISABLED") {
      return jsonError("Mobile v2 is disabled", 404, "feature_disabled");
    }
    return jsonError(error instanceof Error ? error.message : "Unable to poll commands", 400, "command_poll_failed");
  }
}

