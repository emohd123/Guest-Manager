export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { events } from "@/server/db/schema";
import { authenticateMobileRequest, getCheckinSummary } from "@/server/services/checkin";
import { ensureMobileV2Enabled, jsonError } from "../../../../utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    ensureMobileV2Enabled();
    const { eventId } = await params;
    const db = getDb();
    const auth = await authenticateMobileRequest(db, request);

    if (auth.kind === "device" && auth.claims.eventId !== eventId) {
      return jsonError("Device token cannot access another event", 403, "forbidden");
    }

    const companyId = auth.kind === "device" ? auth.claims.companyId : auth.companyId;
    const [event] = await db
      .select({ id: events.id })
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.companyId, companyId)))
      .limit(1);
    if (!event) return jsonError("Event not found", 404, "not_found");

    const summary = await getCheckinSummary(db, { eventId, companyId });
    return NextResponse.json(summary);
  } catch (error) {
    if (error instanceof Error && error.message === "CHECKIN_APP_V2_DISABLED") {
      return jsonError("Mobile v2 is disabled", 404, "feature_disabled");
    }
    return jsonError(error instanceof Error ? error.message : "Unable to load summary", 400, "summary_failed");
  }
}

