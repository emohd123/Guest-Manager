import { TRPCError } from "@trpc/server";

type EventAccessContext = {
  dashboardAccess: string;
  role: string | null;
  userId: string;
  companyId: string;
  supabase: { from: (table: string) => any };
};

export function isFullDashboardAccess(ctx: { dashboardAccess: string; role: string | null }) {
  return ctx.dashboardAccess === "full" || ctx.role === "owner" || ctx.role === "admin";
}

export function applyEventOwnership<T>(
  query: T,
  ctx: { dashboardAccess: string; role: string | null; userId: string },
) {
  return isFullDashboardAccess(ctx) ? query : (query as any).eq("created_by", ctx.userId);
}

export function assertOwnedEvent(row: { created_by?: string | null } | null, ctx: { dashboardAccess: string; role: string | null; userId: string }) {
  if (!row || (!isFullDashboardAccess(ctx) && row.created_by !== ctx.userId)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You can only access events created by your account" });
  }
}

/** Enforces ownership for any dashboard operation carrying an event id. */
export async function assertEventAccess(ctx: EventAccessContext, eventId: string) {
  if (isFullDashboardAccess(ctx)) return;
  const { data, error } = await ctx.supabase
    .from("events")
    .select("id,created_by")
    .eq("id", eventId)
    .eq("company_id", ctx.companyId)
    .maybeSingle();
  if (error || !data || data.created_by !== ctx.userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You can only access events created by your account" });
  }
}
