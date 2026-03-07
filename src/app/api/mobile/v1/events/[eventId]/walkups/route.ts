export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/server/db";
import { devices, events } from "@/server/db/schema";
import { authenticateMobileRequest, createWalkup } from "@/server/services/checkin";
import { ensureMobileV2Enabled, jsonError } from "../../../utils";

const bodySchema = z.object({
  firstName: z.string().min(1).max(255),
  lastName: z.string().max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  guestType: z.string().max(100).optional(),
  ticketTypeId: z.string().uuid().optional(),
  checkInNow: z.boolean().optional(),
  notes: z.string().max(2000).optional(),
  clientMutationId: z.string().max(120).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    ensureMobileV2Enabled();
    const { eventId } = await params;
    const body = bodySchema.parse(await request.json());
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

    let deviceName: string | null = null;
    let deviceId: string | null = null;
    if (auth.kind === "device") {
      deviceId = auth.claims.sub;
      const [device] = await db
        .select({ name: devices.name })
        .from(devices)
        .where(eq(devices.id, auth.claims.sub))
        .limit(1);
      deviceName = device?.name ?? null;
    }

    const result = await createWalkup(db, {
      eventId,
      actor: {
        companyId,
        userId: auth.kind === "staff" ? auth.userId : null,
        deviceId,
        deviceName,
      },
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      guestType: body.guestType,
      ticketTypeId: body.ticketTypeId,
      checkInNow: body.checkInNow,
      notes: body.notes,
      clientMutationId: body.clientMutationId,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Invalid request body", 400, "validation_failed");
    }
    if (error instanceof Error && error.message === "CHECKIN_APP_V2_DISABLED") {
      return jsonError("Mobile v2 is disabled", 404, "feature_disabled");
    }
    return jsonError(error instanceof Error ? error.message : "Unable to create walkup", 400, "walkup_failed");
  }
}

