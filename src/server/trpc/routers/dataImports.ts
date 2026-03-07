import { z } from "zod";
import { router, protectedProcedure } from "../index";

type DataImportRow = {
  id: string;
  company_id: string;
  event_id: string | null;
  user_id: string;
  filename: string;
  records_processed: number | null;
  total_records: number | null;
  status: "pending" | "processing" | "completed" | "failed";
  error_log: string | null;
  created_at: string;
  updated_at: string;
};

function mapDataImport(row: DataImportRow) {
  return {
    id: row.id,
    companyId: row.company_id,
    eventId: row.event_id,
    userId: row.user_id,
    filename: row.filename,
    recordsProcessed: row.records_processed ?? 0,
    totalRecords: row.total_records ?? 0,
    status: row.status,
    errorLog: row.error_log,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const dataImportsRouter = router({
  list: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("data_imports")
        .select("*")
        .eq("event_id", input.eventId)
        .eq("company_id", ctx.companyId)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);

      return {
        dataImports: ((data ?? []) as DataImportRow[]).map((row) => mapDataImport(row)),
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
      const { data, error } = await ctx.supabase
        .from("data_imports")
        .insert({
          company_id: ctx.companyId,
          event_id: input.eventId,
          user_id: ctx.userId,
          filename: input.filename,
          total_records: input.totalRecords,
          status: "pending",
        })
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      return mapDataImport(data as DataImportRow);
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
      const payload: Record<string, unknown> = {
        status: input.status,
        updated_at: new Date().toISOString(),
      };
      if (input.recordsProcessed !== undefined) payload.records_processed = input.recordsProcessed;
      if (input.errorLog !== undefined) payload.error_log = input.errorLog;

      const { data, error } = await ctx.supabase
        .from("data_imports")
        .update(payload)
        .eq("id", input.id)
        .eq("company_id", ctx.companyId)
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      return mapDataImport(data as DataImportRow);
    }),
});
