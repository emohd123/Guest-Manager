import { z } from "zod";
import { router, protectedProcedure } from "../index";
import { companies, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const settingsRouter = router({
  getCompany: protectedProcedure.query(async ({ ctx }) => {
    const company = await ctx.db
      .select()
      .from(companies)
      .where(eq(companies.id, ctx.companyId))
      .limit(1);

    if (!company[0]) throw new Error("Company not found");
    return company[0];
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
      const result = await ctx.db
        .update(companies)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(companies.id, ctx.companyId))
        .returning();

      return result[0];
    }),

  getUser: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db
      .select()
      .from(users)
      .where(eq(users.id, ctx.userId))
      .limit(1);

    if (!user[0]) throw new Error("User not found");
    return user[0];
  }),

  updateUser: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .update(users)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(users.id, ctx.userId))
        .returning();

      return result[0];
    }),

  getTeamMembers: protectedProcedure.query(async ({ ctx }) => {
    const members = await ctx.db
      .select()
      .from(users)
      .where(eq(users.companyId, ctx.companyId));

    return members;
  }),
});
