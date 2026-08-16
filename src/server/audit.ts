import { createSupabaseAdminClient } from "@/server/supabase/admin";

export async function recordAudit(input: {
  companyId?: string | null;
  actorId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  eventId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  if (!input.actorId) return;
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("audit_logs").insert({
    company_id: input.companyId ?? null,
    actor_id: input.actorId,
    event_id: input.eventId ?? null,
    action: input.action,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
  });
  if (error) console.error("audit log write failed", error.message);
}
