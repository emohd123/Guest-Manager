import { TRPCError } from "@trpc/server";

type EventAccessContext = {
  dashboardAccess: string;
  role: string | null;
  userId: string;
  companyId: string;
  customerCompanyId: string | null;
  supabase: { from: (table: string) => any };
};

export function isFullDashboardAccess(ctx: { dashboardAccess: string; role: string | null }) {
  return ctx.dashboardAccess === "full" || ctx.role === "owner" || ctx.role === "admin";
}

export function applyEventOwnership<T>(
  query: T,
  ctx: { dashboardAccess: string; role: string | null; userId: string; customerCompanyId?: string | null },
) {
  if (isFullDashboardAccess(ctx)) return query;
  if (ctx.customerCompanyId) {
    return (query as any).or(`created_by.eq.${ctx.userId},customer_company_id.eq.${ctx.customerCompanyId}`);
  }
  return (query as any).eq("created_by", ctx.userId);
}

export function assertOwnedEvent(row: { created_by?: string | null; customer_company_id?: string | null } | null, ctx: { dashboardAccess: string; role: string | null; userId: string; customerCompanyId?: string | null }) {
  if (!row || (!isFullDashboardAccess(ctx) && row.created_by !== ctx.userId && row.customer_company_id !== ctx.customerCompanyId)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You can only access events assigned to your account" });
  }
}

/** Enforces ownership for any dashboard operation carrying an event id. */
export async function assertEventAccess(ctx: EventAccessContext, eventId: string) {
  if (isFullDashboardAccess(ctx)) return;
  const { data, error } = await ctx.supabase
    .from("events")
    .select("id,created_by,customer_company_id")
    .eq("id", eventId)
    .eq("company_id", ctx.companyId)
    .maybeSingle();
  const allowed = data && (data.created_by === ctx.userId || (ctx.customerCompanyId && data.customer_company_id === ctx.customerCompanyId));
  if (error || !allowed) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You can only access events created by your account" });
  }
}
