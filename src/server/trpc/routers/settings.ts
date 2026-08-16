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

  updateCompany: protectedProcedure
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

  getTeamMembers: protectedProcedure.query(async ({ ctx }) => {
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
      admin.from("users").select("id, company_id, email, name, role, dashboard_access, dashboard_permissions, created_at"),
    ]);
    if (authError) throw new Error(authError.message);
    if (profileError) throw new Error(profileError.message);
    const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    return (authData.users ?? []).map((account) => {
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
      return { ok: true };
    }),
});
