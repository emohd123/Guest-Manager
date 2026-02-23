import { z } from "zod";
import { router, protectedProcedure } from "../index";
import { promotions } from "@/server/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const promotionsRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      const offset = input?.offset ?? 0;

      const results = await ctx.db
        .select()
        .from(promotions)
        .where(eq(promotions.companyId, ctx.companyId))
        .orderBy(desc(promotions.createdAt))
        .limit(limit)
        .offset(offset);

      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(promotions)
        .where(eq(promotions.companyId, ctx.companyId));

      return {
        promotions: results,
        total: Number(countResult[0].count),
      };
    }),
});
