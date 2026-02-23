import { z } from "zod";
import { router, protectedProcedure } from "../index";
import { formResponses } from "@/server/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const formResponsesRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const filters = [eq(formResponses.companyId, ctx.companyId)];
      if (input.eventId) filters.push(eq(formResponses.eventId, input.eventId));

      const results = await ctx.db
        .select()
        .from(formResponses)
        .where(and(...filters))
        .orderBy(desc(formResponses.submittedAt))
        .limit(input.limit)
        .offset(input.offset);

      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(formResponses)
        .where(and(...filters));

      return {
        formResponses: results,
        total: Number(countResult[0].count),
      };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(formResponses)
        .where(
          and(
            eq(formResponses.id, input.id),
            eq(formResponses.companyId, ctx.companyId)
          )
        )
        .limit(1);

      if (!result[0]) throw new Error("Form response not found");
      return result[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(formResponses)
        .where(
          and(
            eq(formResponses.id, input.id),
            eq(formResponses.companyId, ctx.companyId)
          )
        );
      return { success: true };
    }),
});
