import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../index";

type TicketTypeRow = {
  id: string;
  company_id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string | null;
  quantity_total: number | null;
  quantity_sold: number | null;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
  min_per_order: number | null;
  max_per_order: number | null;
  transferable: boolean | null;
  requires_info: boolean | null;
  barcode_type: "qr" | "pdf417" | "code128" | "ean13" | null;
  wallet_enabled: boolean | null;
  status: "active" | "paused" | "sold_out" | "archived" | null;
  sort_order: number | null;
  settings: unknown;
  created_at: string;
  updated_at: string;
};

function mapTicketType(row: TicketTypeRow, eventTitle?: string | null) {
  return {
    id: row.id,
    companyId: row.company_id,
    eventId: row.event_id,
    name: row.name,
    description: row.description,
    price: row.price,
    currency: row.currency,
    quantityTotal: row.quantity_total,
    quantitySold: row.quantity_sold,
    saleStartsAt: row.sale_starts_at,
    saleEndsAt: row.sale_ends_at,
    minPerOrder: row.min_per_order,
    maxPerOrder: row.max_per_order,
    transferable: row.transferable,
    requiresInfo: row.requires_info,
    barcodeType: row.barcode_type,
    walletEnabled: row.wallet_enabled,
    status: row.status,
    sortOrder: row.sort_order,
    settings: row.settings,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    eventTitle: eventTitle ?? null,
  };
}

export const ticketTypesRouter = router({
  listPublic: publicProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data: event, error: eventError } = await ctx.supabase
        .from("events")
        .select("id")
        .eq("id", input.eventId)
        .eq("status", "published")
        .maybeSingle();
      if (eventError) throw new Error(eventError.message);
      if (!event) return [];

      const { data, error } = await ctx.supabase
        .from("ticket_types")
        .select("*")
        .eq("event_id", input.eventId)
        .eq("status", "active")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw new Error(error.message);
      return ((data ?? []) as TicketTypeRow[]).map((row) => mapTicketType(row));
    }),

  list: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("ticket_types")
        .select("*")
        .eq("event_id", input.eventId)
        .eq("company_id", ctx.companyId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw new Error(error.message);
      return ((data ?? []) as TicketTypeRow[]).map((row) => mapTicketType(row));
    }),

  listAll: protectedProcedure
    .input(
      z.object({
        status: z.enum(["active", "paused", "sold_out", "archived"]).optional(),
        limit: z.number().min(1).max(200).default(100),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from("ticket_types")
        .select("*", { count: "exact" })
        .eq("company_id", ctx.companyId)
        .order("created_at", { ascending: true })
        .range(input?.offset ?? 0, (input?.offset ?? 0) + (input?.limit ?? 100) - 1);

      if (input?.status) query = query.eq("status", input.status);

      const { data, error, count } = await query;
      if (error) throw new Error(error.message);

      const rows = (data ?? []) as TicketTypeRow[];
      const eventIds = [...new Set(rows.map((ticketType) => ticketType.event_id).filter(Boolean))];
      let eventTitleMap = new Map<string, string | null>();

      if (eventIds.length > 0) {
        const { data: eventsData, error: eventsError } = await ctx.supabase
          .from("events")
          .select("id,title")
          .in("id", eventIds);
        if (eventsError) throw new Error(eventsError.message);
        eventTitleMap = new Map((eventsData ?? []).map((event) => [event.id, event.title]));
      }

      return {
        ticketTypes: rows.map((row) => mapTicketType(row, eventTitleMap.get(row.event_id) ?? null)),
        total: count ?? 0,
      };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("ticket_types")
        .select("*")
        .eq("id", input.id)
        .eq("company_id", ctx.companyId)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) throw new Error("Ticket type not found");
      return mapTicketType(data as TicketTypeRow);
    }),

  create: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        price: z.number().int().min(0).default(0),
        currency: z.string().length(3).default("USD"),
        quantityTotal: z.number().int().positive().optional(),
        saleStartsAt: z.string().optional(),
        saleEndsAt: z.string().optional(),
        minPerOrder: z.number().int().min(1).default(1),
        maxPerOrder: z.number().int().min(1).default(10),
        transferable: z.boolean().default(false),
        barcodeType: z.enum(["qr", "pdf417", "code128", "ean13"]).default("qr"),
        walletEnabled: z.boolean().default(false),
        status: z.enum(["active", "paused", "sold_out", "archived"]).default("active"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("ticket_types")
        .insert({
          event_id: input.eventId,
          company_id: ctx.companyId,
          name: input.name,
          description: input.description ?? null,
          price: input.price,
          currency: input.currency,
          quantity_total: input.quantityTotal ?? null,
          sale_starts_at: input.saleStartsAt ?? null,
          sale_ends_at: input.saleEndsAt ?? null,
          min_per_order: input.minPerOrder,
          max_per_order: input.maxPerOrder,
          transferable: input.transferable,
          barcode_type: input.barcodeType,
          wallet_enabled: input.walletEnabled,
          status: input.status,
        })
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      return mapTicketType(data as TicketTypeRow);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        price: z.number().int().min(0).optional(),
        currency: z.string().length(3).optional(),
        quantityTotal: z.number().int().positive().nullable().optional(),
        saleStartsAt: z.string().nullable().optional(),
        saleEndsAt: z.string().nullable().optional(),
        minPerOrder: z.number().int().min(1).optional(),
        maxPerOrder: z.number().int().min(1).optional(),
        transferable: z.boolean().optional(),
        barcodeType: z.enum(["qr", "pdf417", "code128", "ean13"]).optional(),
        walletEnabled: z.boolean().optional(),
        status: z.enum(["active", "paused", "sold_out", "archived"]).optional(),
        sortOrder: z.number().int().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (input.name !== undefined) payload.name = input.name;
      if (input.description !== undefined) payload.description = input.description;
      if (input.price !== undefined) payload.price = input.price;
      if (input.currency !== undefined) payload.currency = input.currency;
      if (input.quantityTotal !== undefined) payload.quantity_total = input.quantityTotal;
      if (input.saleStartsAt !== undefined) payload.sale_starts_at = input.saleStartsAt;
      if (input.saleEndsAt !== undefined) payload.sale_ends_at = input.saleEndsAt;
      if (input.minPerOrder !== undefined) payload.min_per_order = input.minPerOrder;
      if (input.maxPerOrder !== undefined) payload.max_per_order = input.maxPerOrder;
      if (input.transferable !== undefined) payload.transferable = input.transferable;
      if (input.barcodeType !== undefined) payload.barcode_type = input.barcodeType;
      if (input.walletEnabled !== undefined) payload.wallet_enabled = input.walletEnabled;
      if (input.status !== undefined) payload.status = input.status;
      if (input.sortOrder !== undefined) payload.sort_order = input.sortOrder;

      const { data, error } = await ctx.supabase
        .from("ticket_types")
        .update(payload)
        .eq("id", input.id)
        .eq("company_id", ctx.companyId)
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      return mapTicketType(data as TicketTypeRow);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("ticket_types")
        .delete()
        .eq("id", input.id)
        .eq("company_id", ctx.companyId);

      if (error) throw new Error(error.message);
      return { success: true };
    }),

  stats: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("ticket_types")
        .select("quantity_total,quantity_sold")
        .eq("event_id", input.eventId)
        .eq("company_id", ctx.companyId);

      if (error) throw new Error(error.message);

      return {
        count: data?.length ?? 0,
        totalCapacity: (data ?? []).reduce<number | null>((sum, row) => {
          if (row.quantity_total == null) return sum;
          return (sum ?? 0) + row.quantity_total;
        }, null),
        totalSold: (data ?? []).reduce((sum, row) => sum + (row.quantity_sold ?? 0), 0),
      };
    }),
});
