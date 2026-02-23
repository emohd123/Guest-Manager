import { z } from "zod";
import { router, protectedProcedure } from "../index";
import { campaigns } from "@/server/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const campaignsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const filters = [eq(campaigns.companyId, ctx.companyId)];
      if (input.eventId) filters.push(eq(campaigns.eventId, input.eventId));

      const results = await ctx.db
        .select()
        .from(campaigns)
        .where(and(...filters))
        .orderBy(desc(campaigns.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(campaigns)
        .where(and(...filters));

      return {
        campaigns: results,
        total: Number(countResult[0].count),
      };
    }),
});
