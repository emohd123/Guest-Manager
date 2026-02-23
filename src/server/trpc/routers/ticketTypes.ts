import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../index";
import { ticketTypes, events } from "@/server/db/schema";
import { eq, and, asc, sql } from "drizzle-orm";

export const ticketTypesRouter = router({
  listPublic: publicProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(ticketTypes)
        .where(
          and(
            eq(ticketTypes.eventId, input.eventId),
            eq(ticketTypes.status, 'active')
          )
        )
        .orderBy(asc(ticketTypes.sortOrder), asc(ticketTypes.createdAt));
    }),

    list: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(ticketTypes)
        .where(
          and(
            eq(ticketTypes.eventId, input.eventId),
            eq(ticketTypes.companyId, ctx.companyId)
          )
        )
        .orderBy(asc(ticketTypes.sortOrder), asc(ticketTypes.createdAt));
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
      const filters = [eq(ticketTypes.companyId, ctx.companyId)];
      if (input?.status) filters.push(eq(ticketTypes.status, input.status));

      const results = await ctx.db
        .select({
          id: ticketTypes.id,
          eventId: ticketTypes.eventId,
          name: ticketTypes.name,
          description: ticketTypes.description,
          price: ticketTypes.price,
          currency: ticketTypes.currency,
          quantityTotal: ticketTypes.quantityTotal,
          quantitySold: ticketTypes.quantitySold,
          status: ticketTypes.status,
          barcodeType: ticketTypes.barcodeType,
          saleStartsAt: ticketTypes.saleStartsAt,
          saleEndsAt: ticketTypes.saleEndsAt,
          createdAt: ticketTypes.createdAt,
          eventTitle: events.title,
        })
        .from(ticketTypes)
        .leftJoin(events, eq(ticketTypes.eventId, events.id))
        .where(and(...filters))
        .orderBy(asc(ticketTypes.createdAt))
        .limit(input?.limit ?? 100)
        .offset(input?.offset ?? 0);

      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(ticketTypes)
        .where(and(...filters));

      return {
        ticketTypes: results,
        total: Number(countResult[0].count),
      };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(ticketTypes)
        .where(
          and(
            eq(ticketTypes.id, input.id),
            eq(ticketTypes.companyId, ctx.companyId)
          )
        )
        .limit(1);

      if (!result[0]) throw new Error("Ticket type not found");
      return result[0];
    }),

  create: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        price: z.number().int().min(0).default(0), // in cents
        currency: z.string().length(3).default("USD"),
        quantityTotal: z.number().int().positive().optional(),
        saleStartsAt: z.string().optional(), // ISO date string
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
      const result = await ctx.db
        .insert(ticketTypes)
        .values({
          eventId: input.eventId,
          companyId: ctx.companyId,
          name: input.name,
          description: input.description,
          price: input.price,
          currency: input.currency,
          quantityTotal: input.quantityTotal,
          saleStartsAt: input.saleStartsAt ? new Date(input.saleStartsAt) : undefined,
          saleEndsAt: input.saleEndsAt ? new Date(input.saleEndsAt) : undefined,
          minPerOrder: input.minPerOrder,
          maxPerOrder: input.maxPerOrder,
          transferable: input.transferable,
          barcodeType: input.barcodeType,
          walletEnabled: input.walletEnabled,
          status: input.status,
        })
        .returning();

      return result[0];
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
      const { id, saleStartsAt, saleEndsAt, ...rest } = input;
      const updateData: Record<string, unknown> = { ...rest, updatedAt: new Date() };

      if (saleStartsAt !== undefined) {
        updateData.saleStartsAt = saleStartsAt ? new Date(saleStartsAt) : null;
      }
      if (saleEndsAt !== undefined) {
        updateData.saleEndsAt = saleEndsAt ? new Date(saleEndsAt) : null;
      }

      // Remove undefined values
      for (const key of Object.keys(updateData)) {
        if (updateData[key] === undefined) delete updateData[key];
      }

      const result = await ctx.db
        .update(ticketTypes)
        .set(updateData)
        .where(
          and(
            eq(ticketTypes.id, id),
            eq(ticketTypes.companyId, ctx.companyId)
          )
        )
        .returning();

      return result[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(ticketTypes)
        .where(
          and(
            eq(ticketTypes.id, input.id),
            eq(ticketTypes.companyId, ctx.companyId)
          )
        );
      return { success: true };
    }),

  stats: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({
          count: sql<number>`count(*)`,
          totalCapacity: sql<number>`sum(${ticketTypes.quantityTotal})`,
          totalSold: sql<number>`sum(${ticketTypes.quantitySold})`,
        })
        .from(ticketTypes)
        .where(
          and(
            eq(ticketTypes.eventId, input.eventId),
            eq(ticketTypes.companyId, ctx.companyId)
          )
        );

      return {
        count: Number(result[0]?.count ?? 0),
        totalCapacity: result[0]?.totalCapacity ? Number(result[0].totalCapacity) : null,
        totalSold: Number(result[0]?.totalSold ?? 0),
      };
    }),
});
