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
  // The live events schema is customer-company scoped and does not include
  // created_by. Filter by the assigned customer company directly so limited
  // accounts can see their events without querying a legacy column.
  if (ctx.customerCompanyId) {
    return (query as any).eq("customer_company_id", ctx.customerCompanyId);
  }
  return (query as any).eq("id", "__no_access__");
}

export function assertOwnedEvent(row: { created_by?: string | null; customer_company_id?: string | null } | null, ctx: { dashboardAccess: string; role: string | null; userId: string; customerCompanyId?: string | null }) {
  if (!row || (!isFullDashboardAccess(ctx) && row.customer_company_id !== ctx.customerCompanyId)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You can only access events assigned to your account" });
  }
}

/** Enforces ownership for any dashboard operation carrying an event id. */
export async function assertEventAccess(ctx: EventAccessContext, eventId: string) {
  if (isFullDashboardAccess(ctx)) return;
  const { data, error } = await ctx.supabase
    .from("events")
.select("id,customer_company_id")
    .eq("id", eventId)
    .eq("company_id", ctx.companyId)
    .maybeSingle();
  const allowed = data && ctx.customerCompanyId && data.customer_company_id === ctx.customerCompanyId;
  if (error || !allowed) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You can only access events created by your account" });
  }
}
