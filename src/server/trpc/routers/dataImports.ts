import { z } from "zod";
import { router, protectedProcedure } from "../index";
import { dataImports } from "../../db/schema/data-imports";
import { eq, and, desc } from "drizzle-orm";

export const dataImportsRouter = router({
  list: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const results = await ctx.db
        .select()
        .from(dataImports)
        .where(
          and(
            eq(dataImports.eventId, input.eventId),
            eq(dataImports.companyId, ctx.companyId)
          )
        )
        .orderBy(desc(dataImports.createdAt));

      return {
        dataImports: results,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        filename: z.string(),
        totalRecords: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [result] = await ctx.db
        .insert(dataImports)
        .values({
          companyId: ctx.companyId,
          eventId: input.eventId,
          userId: ctx.userId,
          filename: input.filename,
          totalRecords: input.totalRecords,
          status: "pending",
        })
        .returning();

      return result;
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(["pending", "processing", "completed", "failed"]),
        recordsProcessed: z.number().optional(),
        errorLog: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [result] = await ctx.db
        .update(dataImports)
        .set({
          status: input.status,
          recordsProcessed: input.recordsProcessed,
          errorLog: input.errorLog,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(dataImports.id, input.id),
            eq(dataImports.companyId, ctx.companyId)
          )
        )
        .returning();

      return result;
    }),
});
