import { z } from "zod";
import { router, protectedProcedure } from "../index";

type FormResponseRow = {
  id: string;
  company_id: string;
  event_id: string | null;
  contact_id: string | null;
  response_data: unknown;
  metadata: unknown;
  submitted_at: string;
};

function mapFormResponse(row: FormResponseRow) {
  return {
    id: row.id,
    companyId: row.company_id,
    eventId: row.event_id,
    contactId: row.contact_id,
    responseData: row.response_data,
    metadata: row.metadata,
    submittedAt: row.submitted_at,
  };
}

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
      let query = ctx.supabase
        .from("form_responses")
        .select("*", { count: "exact" })
        .eq("company_id", ctx.companyId)
        .order("submitted_at", { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (input.eventId) {
        query = query.eq("event_id", input.eventId);
      }

      const { data, error, count } = await query;
      if (error) throw new Error(error.message);

      return {
        formResponses: ((data ?? []) as FormResponseRow[]).map((row) => mapFormResponse(row)),
        total: count ?? 0,
      };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("form_responses")
        .select("*")
        .eq("id", input.id)
        .eq("company_id", ctx.companyId)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) throw new Error("Form response not found");
      return mapFormResponse(data as FormResponseRow);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("form_responses")
        .delete()
        .eq("id", input.id)
        .eq("company_id", ctx.companyId);

      if (error) throw new Error(error.message);
      return { success: true };
    }),
});
