import { z } from "zod";
import { router, protectedProcedure } from "../index";
import { devices } from "@/server/db/schema";
import { eq, and, desc, ilike, sql } from "drizzle-orm";

export const devicesRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const filters = [
        eq(devices.companyId, ctx.companyId),
        eq(devices.eventId, input.eventId),
      ];

      if (input.search) {
        filters.push(ilike(devices.name, `%${input.search}%`));
      }

      const results = await ctx.db
        .select()
        .from(devices)
        .where(and(...filters))
        .orderBy(desc(devices.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(devices)
        .where(and(...filters));

      return {
        devices: results,
        total: Number(countResult[0].count),
      };
    }),
});
