import { z } from "zod";
import { router, protectedProcedure } from "../index";
import { scans, tickets, guests } from "@/server/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const scansRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid().optional(),
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const filters = [eq(scans.companyId, ctx.companyId)];
      if (input.eventId) {
        filters.push(eq(scans.eventId, input.eventId));
      }

      const results = await ctx.db
        .select({
          id: scans.id,
          eventId: scans.eventId,
          ticketId: scans.ticketId,
          scanType: scans.scanType,
          barcode: scans.barcode,
          result: scans.result,
          notes: scans.notes,
          deviceInfo: scans.deviceInfo,
          scannedAt: scans.scannedAt,
          // Join ticket info
          attendeeName: tickets.attendeeName,
          attendeeEmail: tickets.attendeeEmail,
          // Join guest info
          guestFirstName: guests.firstName,
          guestLastName: guests.lastName,
          guestType: guests.guestType,
        })
        .from(scans)
        .leftJoin(tickets, eq(scans.ticketId, tickets.id))
        .leftJoin(guests, eq(tickets.guestId, guests.id))
        .where(and(...filters))
        .orderBy(desc(scans.scannedAt))
        .limit(input.limit)
        .offset(input.offset);

      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(scans)
        .where(and(...filters));

      return {
        scans: results,
        total: Number(countResult[0].count),
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        ticketId: z.string().uuid().optional(),
        barcode: z.string().optional(),
        scanType: z.enum(["check_in", "checkout", "invalid"]).default("check_in"),
        result: z.string().optional(),
        notes: z.string().optional(),
        deviceInfo: z.record(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [scan] = await ctx.db
        .insert(scans)
        .values({
          companyId: ctx.companyId,
          eventId: input.eventId,
          ticketId: input.ticketId,
          barcode: input.barcode,
          scanType: input.scanType,
          result: input.result,
          notes: input.notes,
          deviceInfo: input.deviceInfo ?? {},
        })
        .returning();

      return scan;
    }),
});
