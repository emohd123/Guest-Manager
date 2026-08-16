import { z } from "zod";
import { router, protectedProcedure, dashboardAdminProcedure } from "../index";
import { createSupabaseAdminClient } from "@/server/supabase/admin";

export const settingsRouter = router({
  getCompany: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("companies")
      .select("*")
      .eq("id", ctx.companyId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Company not found");
    return data;
  }),

  updateCompany: dashboardAdminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255).optional(),
        slug: z.string().min(1).max(255).optional(),
        timezone: z.string().max(50).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (input.name !== undefined) payload.name = input.name;
      if (input.slug !== undefined) payload.slug = input.slug;
      if (input.timezone !== undefined) payload.timezone = input.timezone;

      const { data, error } = await ctx.supabase
        .from("companies")
        .update(payload)
        .eq("id", ctx.companyId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  getUser: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("users")
      .select("*")
      .eq("id", ctx.userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("User not found");
    return data;
  }),

  updateUser: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (input.name !== undefined) payload.name = input.name;

      const { data, error } = await ctx.supabase
        .from("users")
        .update(payload)
        .eq("id", ctx.userId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  getTeamMembers: dashboardAdminProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("users")
      .select("*")
      .eq("company_id", ctx.companyId);

    if (error) throw new Error(error.message);
    return data ?? [];
  }),

  listAccounts: dashboardAdminProcedure.query(async ({ ctx }) => {
    const admin = createSupabaseAdminClient();
    const [{ data: authData, error: authError }, { data: profiles, error: profileError }] = await Promise.all([
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      admin.from("users").select("id, company_id, email, name, role, dashboard_access, dashboard_permissions, created_at").eq("company_id", ctx.companyId),
    ]);
    if (authError) throw new Error(authError.message);
    if (profileError) throw new Error(profileError.message);
    const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    return (authData.users ?? []).filter((account) => profileById.has(account.id)).map((account) => {
      const profile = profileById.get(account.id);
      const access = profile?.dashboard_access ?? "none";
      return {
        id: account.id,
        email: account.email ?? profile?.email ?? "",
        name: profile?.name ?? (account.user_metadata?.name as string | undefined) ?? null,
        role: profile?.role ?? "buyer",
        companyId: profile?.company_id ?? null,
        dashboardAccess: access,
        dashboardPermissions: Array.isArray(profile?.dashboard_permissions) ? profile.dashboard_permissions : [],
        createdAt: account.created_at,
      };
    });
  }),

  updateAccountAccess: dashboardAdminProcedure
    .input(z.object({
      userId: z.string().uuid(),
      dashboardAccess: z.enum(["none", "limited", "full"]),
      dashboardPermissions: z.array(z.string().max(40)).max(30).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.userId && input.dashboardAccess === "none") {
        throw new Error("You cannot remove your own dashboard access");
      }
      const admin = createSupabaseAdminClient();
      const { data: authUser, error: authError } = await admin.auth.admin.getUserById(input.userId);
      if (authError || !authUser.user) throw new Error(authError?.message ?? "Account not found");
      const payload = {
        id: input.userId,
        company_id: input.dashboardAccess === "none" ? null : ctx.companyId,
        email: authUser.user.email ?? "",
        name: (authUser.user.user_metadata?.name as string | undefined) ?? authUser.user.email ?? "Customer",
        role: input.dashboardAccess === "full" ? "admin" : input.dashboardAccess === "limited" ? "manager" : "staff",
        dashboard_access: input.dashboardAccess,
        dashboard_permissions: input.dashboardAccess === "full" ? ["*"] : input.dashboardPermissions,
        updated_at: new Date().toISOString(),
      };
      const { error } = await admin.from("users").upsert(payload, { onConflict: "id" });
      if (error) throw new Error(error.message);
      const { recordAudit } = await import("@/server/audit");
      void recordAudit({ companyId: ctx.companyId, actorId: ctx.userId, action: "account.access_updated", entityType: "user", entityId: input.userId, metadata: { dashboardAccess: input.dashboardAccess, permissions: input.dashboardPermissions } });
      return { ok: true };
    }),

  listAuditLogs: dashboardAdminProcedure
    .input(z.object({ actorId: z.string().uuid().optional(), eventId: z.string().uuid().optional(), action: z.string().max(100).optional(), limit: z.number().min(1).max(100).default(50), offset: z.number().min(0).default(0) }).optional())
    .query(async ({ ctx, input }) => {
      const admin = createSupabaseAdminClient();
      let query = admin.from("audit_logs").select("id, company_id, actor_id, event_id, action, entity_type, entity_id, metadata, created_at", { count: "exact" }).eq("company_id", ctx.companyId).order("created_at", { ascending: false }).range(input?.offset ?? 0, (input?.offset ?? 0) + (input?.limit ?? 50) - 1);
      if (input?.actorId) query = query.eq("actor_id", input.actorId);
      if (input?.eventId) query = query.eq("event_id", input.eventId);
      if (input?.action) query = query.ilike("action", `%${input.action}%`);
      const { data, error, count } = await query;
      if (error) throw new Error(error.message);
      const logs = data ?? [];
      const actorIds = [...new Set(logs.map((log) => log.actor_id).filter(Boolean))];
      const eventIds = [...new Set(logs.map((log) => log.event_id).filter(Boolean))];
      const [{ data: actors }, { data: events }] = await Promise.all([
        actorIds.length ? admin.from("users").select("id,name,email").in("id", actorIds) : Promise.resolve({ data: [] }),
        eventIds.length ? admin.from("events").select("id,title").in("id", eventIds) : Promise.resolve({ data: [] }),
      ]);
      const actorById = new Map((actors ?? []).map((actor) => [actor.id, actor]));
      const eventById = new Map((events ?? []).map((event) => [event.id, event]));
      return {
        logs: logs.map((log) => ({
          ...log,
          actor_name: log.actor_id ? actorById.get(log.actor_id)?.name ?? actorById.get(log.actor_id)?.email ?? null : null,
          event_title: log.event_id ? eventById.get(log.event_id)?.title ?? null : null,
        })),
        total: count ?? 0,
      };
    }),
});
