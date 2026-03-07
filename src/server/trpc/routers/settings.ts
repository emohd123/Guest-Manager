import { z } from "zod";
import { router, protectedProcedure } from "../index";

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
});
