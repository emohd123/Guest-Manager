import { z } from "zod";
import { router, protectedProcedure } from "../index";

const promotionInput = z.object({
  eventId: z.string().uuid(),
  code: z.string().trim().min(2).max(50),
  percentage: z.number().int().min(1).max(100),
  maxTickets: z.number().int().min(1).max(100000),
  description: z.string().trim().max(500).optional(),
});

export const promotionsRouter = router({
  list: protectedProcedure
    .input(z.object({ eventId: z.string().uuid().optional(), limit: z.number().min(1).max(100).default(50), offset: z.number().min(0).default(0) }).optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      const offset = input?.offset ?? 0;
      let query = ctx.supabase
        .from("promotions")
        .select("*", { count: "exact" })
        .eq("company_id", ctx.companyId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      if (input?.eventId) query = query.eq("event_id", input.eventId);
      const { data, error, count } = await query;
      if (error) throw new Error(error.message);
      return { promotions: data ?? [], total: count ?? 0 };
    }),

  create: protectedProcedure
    .input(promotionInput)
    .mutation(async ({ ctx, input }) => {
      const { data: event, error: eventError } = await ctx.supabase
        .from("events")
        .select("id")
        .eq("id", input.eventId)
        .eq("company_id", ctx.companyId)
        .maybeSingle();
      if (eventError) throw new Error(eventError.message);
      if (!event) throw new Error("Event not found.");
      const code = input.code.toUpperCase();
      const { data: existing } = await ctx.supabase
        .from("promotions")
        .select("id")
        .eq("company_id", ctx.companyId)
        .eq("event_id", input.eventId)
        .ilike("code", code)
        .maybeSingle();
      if (existing) throw new Error("That promo code already exists for this event.");
      const { data, error } = await ctx.supabase
        .from("promotions")
        .insert({
          company_id: ctx.companyId,
          event_id: input.eventId,
          code,
          description: input.description || null,
          discount_type: "percentage",
          value: input.percentage,
          max_uses: input.maxTickets,
          current_uses: 0,
          is_active: true,
        })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return data;
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("promotions")
        .delete()
        .eq("id", input.id)
        .eq("company_id", ctx.companyId);
      if (error) throw new Error(error.message);
      return { success: true };
    }),
});
