import { z } from "zod";
import { router, protectedProcedure } from "../index";
import { guests, scans, tickets } from "@/server/db/schema";
import { eq, and, desc, ilike, sql, or, inArray } from "drizzle-orm";

export const guestsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        search: z.string().optional(),
        status: z
          .enum(["invited", "confirmed", "declined", "waitlisted", "checked_in", "no_show"])
          .optional(),
        limit: z.number().min(1).max(500).default(100),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const filters = [
        eq(guests.eventId, input.eventId),
        eq(guests.companyId, ctx.companyId),
      ];

      if (input.status) {
        filters.push(eq(guests.status, input.status));
      }

      if (input.search) {
        filters.push(
          or(
            ilike(guests.firstName, `%${input.search}%`),
            ilike(guests.lastName, `%${input.search}%`),
            ilike(guests.email, `%${input.search}%`)
          )!
        );
      }

      const results = await ctx.db
        .select()
        .from(guests)
        .where(and(...filters))
        .orderBy(desc(guests.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(guests)
        .where(and(...filters));

      return {
        guests: results,
        total: Number(countResult[0].count),
      };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const guest = await ctx.db
        .select()
        .from(guests)
        .where(
          and(eq(guests.id, input.id), eq(guests.companyId, ctx.companyId))
        )
        .limit(1);

      if (!guest[0]) throw new Error("Guest not found");
      return guest[0];
    }),

  create: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        firstName: z.string().min(1).max(255),
        lastName: z.string().max(255).optional(),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().max(50).optional(),
        guestType: z.string().max(100).optional(),
        tableNumber: z.string().max(50).optional(),
        seatNumber: z.string().max(50).optional(),
        notes: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .insert(guests)
        .values({
          eventId: input.eventId,
          companyId: ctx.companyId,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email || null,
          phone: input.phone,
          guestType: input.guestType,
          tableNumber: input.tableNumber,
          seatNumber: input.seatNumber,
          notes: input.notes,
          tags: input.tags,
          source: "manual",
        })
        .returning();

      return result[0];
    }),

  bulkCreate: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        guests: z.array(
          z.object({
            firstName: z.string().min(1),
            lastName: z.string().optional(),
            email: z.string().optional(),
            phone: z.string().optional(),
            guestType: z.string().optional(),
            tableNumber: z.string().optional(),
            seatNumber: z.string().optional(),
            notes: z.string().optional(),
            tags: z.array(z.string()).optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const values = input.guests.map((g) => ({
        eventId: input.eventId,
        companyId: ctx.companyId,
        firstName: g.firstName,
        lastName: g.lastName,
        email: g.email || null,
        phone: g.phone,
        guestType: g.guestType,
        tableNumber: g.tableNumber,
        seatNumber: g.seatNumber,
        notes: g.notes,
        tags: g.tags,
        source: "import" as const,
      }));

      const result = await ctx.db.insert(guests).values(values).returning();
      return { imported: result.length };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        firstName: z.string().min(1).max(255).optional(),
        lastName: z.string().max(255).optional(),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().max(50).optional(),
        status: z
          .enum(["invited", "confirmed", "declined", "waitlisted", "checked_in", "no_show"])
          .optional(),
        guestType: z.string().max(100).optional(),
        tableNumber: z.string().max(50).optional(),
        seatNumber: z.string().max(50).optional(),
        notes: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = { updatedAt: new Date() };

      Object.entries(data).forEach(([key, val]) => {
        if (val !== undefined) updateData[key] = val;
      });

      const result = await ctx.db
        .update(guests)
        .set(updateData)
        .where(and(eq(guests.id, id), eq(guests.companyId, ctx.companyId)))
        .returning();

      return result[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(guests)
        .where(
          and(eq(guests.id, input.id), eq(guests.companyId, ctx.companyId))
        );
      return { success: true };
    }),

  bulkDelete: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.string().uuid()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      for (const id of input.ids) {
        await ctx.db
          .delete(guests)
          .where(and(eq(guests.id, id), eq(guests.companyId, ctx.companyId)));
      }
      return { deleted: input.ids.length };
    }),

  bulkUpdateStatus: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.string().uuid()),
        status: z.enum(["invited", "confirmed", "declined", "waitlisted", "checked_in", "no_show"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: Record<string, unknown> = { status: input.status, updatedAt: new Date() };
      if (input.status === "checked_in") {
        updateData.checkedInAt = new Date();
      } else if (input.status === "confirmed") {
        updateData.checkedInAt = null;
      }

      const result = await ctx.db
        .update(guests)
        .set(updateData)
        .where(
          and(
            inArray(guests.id, input.ids),
            eq(guests.companyId, ctx.companyId)
          )
        )
        .returning();

      return { updated: result.length };
    }),

  stats: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const all = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(guests)
        .where(
          and(
            eq(guests.eventId, input.eventId),
            eq(guests.companyId, ctx.companyId)
          )
        );

      const statusCounts = await ctx.db
        .select({
          status: guests.status,
          count: sql<number>`count(*)`,
        })
        .from(guests)
        .where(
          and(
            eq(guests.eventId, input.eventId),
            eq(guests.companyId, ctx.companyId)
          )
        )
        .groupBy(guests.status);

      const counts = {
        total: Number(all[0].count),
        invited: 0,
        confirmed: 0,
        declined: 0,
        waitlisted: 0,
        checked_in: 0,
        no_show: 0,
      };

      statusCounts.forEach((row) => {
        if (row.status && row.status in counts) {
          counts[row.status as keyof typeof counts] = Number(row.count);
        }
      });

      return {
        ...counts,
        checkedIn: counts.checked_in,
      };
    }),

  checkIn: protectedProcedure
    .input(
      z.object({
        guestId: z.string().uuid(),
        eventId: z.string().uuid(),
        barcode: z.string().optional(),
        deviceInfo: z.record(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const guest = await ctx.db
        .select()
        .from(guests)
        .where(
          and(
            eq(guests.id, input.guestId),
            eq(guests.eventId, input.eventId),
            eq(guests.companyId, ctx.companyId)
          )
        )
        .limit(1);

      if (!guest[0]) throw new Error("Guest not found for this event");

      if (guest[0].status === "checked_in") {
        return { guest: guest[0], alreadyCheckedIn: true };
      }

      // Update guest status
      const [updatedGuest] = await ctx.db
        .update(guests)
        .set({ status: "checked_in", checkedInAt: new Date(), updatedAt: new Date() })
        .where(eq(guests.id, input.guestId))
        .returning();

      // Find associated ticket for this guest
      const [ticket] = await ctx.db
        .select()
        .from(tickets)
        .where(
          and(
            eq(tickets.guestId, input.guestId),
            eq(tickets.eventId, input.eventId)
          )
        )
        .limit(1);

      // Write a scan record for audit trail
      await ctx.db.insert(scans).values({
        companyId: ctx.companyId,
        eventId: input.eventId,
        ticketId: ticket?.id ?? undefined,
        scanType: "check_in",
        barcode: input.barcode ?? ticket?.barcode ?? undefined,
        result: "Success",
        deviceInfo: input.deviceInfo ?? {},
      });

      return { guest: updatedGuest, alreadyCheckedIn: false };
    }),

  undoCheckIn: protectedProcedure
    .input(
      z.object({
        guestId: z.string().uuid(),
        eventId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updatedGuest] = await ctx.db
        .update(guests)
        .set({ status: "confirmed", checkedInAt: null, updatedAt: new Date() })
        .where(
          and(
            eq(guests.id, input.guestId),
            eq(guests.eventId, input.eventId),
            eq(guests.companyId, ctx.companyId)
          )
        )
        .returning();

      if (!updatedGuest) throw new Error("Guest not found");

      // Write checkout scan record
      await ctx.db.insert(scans).values({
        companyId: ctx.companyId,
        eventId: input.eventId,
        scanType: "checkout",
        result: "Undone by staff",
        deviceInfo: {},
      });

      return { guest: updatedGuest };
    }),
});

