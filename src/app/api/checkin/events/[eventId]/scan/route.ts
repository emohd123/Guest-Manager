export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { getBearerToken, processScanWorkflowSupabase } from "@/server/services/checkin";

const bodySchema = z.object({
  barcode: z.string().trim().min(1).max(512),
  action: z.enum(["check_in", "checkout"]).default("check_in"),
  deviceId: z.string().trim().max(160).optional(),
  deviceName: z.string().trim().max(160).optional(),
  clientMutationId: z.string().trim().max(120).optional(),
});

function errorResponse(error: string, status: number, requestId: string) {
  return NextResponse.json(
    { error, requestId },
    { status, headers: { "cache-control": "no-store" } }
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const requestId = crypto.randomUUID();
  try {
    const { eventId } = await params;
    if (!z.string().uuid().safeParse(eventId).success) {
      return errorResponse("Invalid event.", 400, requestId);
    }
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) return errorResponse("Invalid scan request.", 400, requestId);

    const admin = createSupabaseAdminClient();
    const sessionClient = await createSupabaseServerClient();
    const { data: authData } = await sessionClient.auth.getUser();
    let authUserId = authData.user?.id ?? null;

    // Browser scans normally authenticate with the Supabase session cookie. The
    // bearer fallback keeps the endpoint usable in restrictive mobile browsers
    // and lets the native scanner use the exact same, event-scoped workflow.
    if (!authUserId) {
      const bearerToken = getBearerToken(request);
      if (bearerToken) {
        const { data: bearerAuth } = await admin.auth.getUser(bearerToken);
        authUserId = bearerAuth.user?.id ?? null;
      }
    }

    if (!authUserId) {
      return errorResponse("Your session expired. Sign in again.", 401, requestId);
    }

    const { data: appUser, error: userError } = await admin
      .from("users")
      .select("id,company_id")
      .eq("id", authUserId)
      .maybeSingle();
    if (userError || !appUser?.company_id) {
      return errorResponse("This account does not have scanner access.", 403, requestId);
    }

    const { data: event, error: eventError } = await admin
      .from("events")
      .select("id")
      .eq("id", eventId)
      .eq("company_id", appUser.company_id)
      .is("deleted_at", null)
      .maybeSingle();
    if (eventError || !event) {
      return errorResponse("This event is not assigned to your company.", 403, requestId);
    }

    const result = await processScanWorkflowSupabase({
      eventId,
      barcode: parsed.data.barcode,
      action: parsed.data.action,
      method: "scan",
      clientMutationId: parsed.data.clientMutationId,
      actor: {
        companyId: appUser.company_id,
        userId: appUser.id,
        deviceId: parsed.data.deviceId ?? null,
        deviceName: parsed.data.deviceName ?? "Company Web Scanner",
      },
    });

    let ticketTypeName: string | null = null;
    if (result.ticketId) {
      const { data: ticket } = await admin
        .from("tickets")
        .select("ticket_type_id")
        .eq("id", result.ticketId)
        .maybeSingle();
      if (ticket?.ticket_type_id) {
        const { data: ticketType } = await admin
          .from("ticket_types")
          .select("name")
          .eq("id", ticket.ticket_type_id)
          .maybeSingle();
        ticketTypeName = ticketType?.name ?? null;
      }
    }

    return NextResponse.json(
      { ...result, ticketTypeName, requestId },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown scanner failure";
    console.error("Company scan endpoint failed", { requestId, message });
    return errorResponse("The ticket service is temporarily unavailable.", 500, requestId);
  }
}
