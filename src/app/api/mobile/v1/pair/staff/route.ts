export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/server/db";
import { getBearerToken, pairWithStaff, validateStaffToken } from "@/server/services/checkin";
import { ensureMobileV2Enabled, jsonError } from "../../utils";

const bodySchema = z.object({
  eventId: z.string().uuid(),
  device: z
    .object({
      name: z.string().max(120).optional(),
      installationId: z.string().max(255).optional(),
      platform: z.string().max(20).optional(),
      model: z.string().max(100).optional(),
      osVersion: z.string().max(50).optional(),
      appVersion: z.string().max(40).optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    ensureMobileV2Enabled();
    const parsed = bodySchema.parse(await request.json());
    const db = getDb();
    const bearer = getBearerToken(request);
    if (!bearer) return jsonError("Missing bearer token", 401, "unauthorized");

    const staff = await validateStaffToken(db, bearer);
    if (!staff) return jsonError("Invalid staff token", 401, "unauthorized");

    const result = await pairWithStaff(db, {
      eventId: parsed.eventId,
      staffCompanyId: staff.companyId,
      device: {
        name: parsed.device?.name,
        installationId: parsed.device?.installationId,
        platform: parsed.device?.platform,
        model: parsed.device?.model,
        osVersion: parsed.device?.osVersion,
        appVersion: parsed.device?.appVersion,
      },
    });

    return NextResponse.json({
      token: result.token,
      device: result.device,
      staffUserId: staff.userId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Invalid request body", 400, "validation_failed");
    }
    if (error instanceof Error && error.message === "CHECKIN_APP_V2_DISABLED") {
      return jsonError("Mobile v2 is disabled", 404, "feature_disabled");
    }
    return jsonError(error instanceof Error ? error.message : "Unable to pair device", 400, "pair_failed");
  }
}

