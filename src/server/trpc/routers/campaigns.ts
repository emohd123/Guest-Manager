import { z } from "zod";
import { router, protectedProcedure } from "../index";

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
      let query = ctx.supabase
        .from("campaigns")
        .select("*", { count: "exact" })
        .eq("company_id", ctx.companyId)
        .order("created_at", { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (input.eventId) query = query.eq("event_id", input.eventId);

      const { data, error, count } = await query;
      if (error) throw new Error(error.message);

      return {
        campaigns: data ?? [],
        total: count ?? 0,
      };
    }),
});
