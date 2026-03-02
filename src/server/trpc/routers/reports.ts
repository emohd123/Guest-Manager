import { z } from "zod";
import { router, protectedProcedure } from "../index";
import {
  exportArrivalsCsv,
  exportCheckinsCsv,
  exportNoShowsCsv,
  getCheckinSummary,
} from "@/server/services/checkin";

export const reportsRouter = router({
  checkInSummary: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      return getCheckinSummary(ctx.db, {
        eventId: input.eventId,
        companyId: ctx.companyId,
      });
    }),

  exportCheckinsCsv: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const csv = await exportCheckinsCsv(ctx.db, {
        eventId: input.eventId,
        companyId: ctx.companyId,
      });
      return {
        filename: `checkins-${input.eventId}.csv`,
        contentType: "text/csv",
        csv,
      };
    }),

  exportNoShowsCsv: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const csv = await exportNoShowsCsv(ctx.db, {
        eventId: input.eventId,
        companyId: ctx.companyId,
      });
      return {
        filename: `no-shows-${input.eventId}.csv`,
        contentType: "text/csv",
        csv,
      };
    }),

  exportArrivalsCsv: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const csv = await exportArrivalsCsv(ctx.db, {
        eventId: input.eventId,
        companyId: ctx.companyId,
      });
      return {
        filename: `arrivals-${input.eventId}.csv`,
        contentType: "text/csv",
        csv,
      };
    }),
});

