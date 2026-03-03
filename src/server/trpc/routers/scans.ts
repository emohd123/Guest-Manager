import { z } from "zod";
import { router, protectedProcedure } from "../index";
import { devices, guests, scans, tickets } from "@/server/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { getArrivals } from "@/server/services/checkin";

export const scansRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid().optional(),
        limit: z.number().min(1).max(500).default(100),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      if (input.eventId) {
        return getArrivals(ctx.db, {
          eventId: input.eventId,
          companyId: ctx.companyId,
          limit: input.limit,
          offset: input.offset,
        });
      }

      const filters = [eq(scans.companyId, ctx.companyId)];
      const rows = await ctx.db
        .select({
          id: scans.id,
          eventId: scans.eventId,
          ticketId: scans.ticketId,
          deviceId: scans.deviceId,
          scanType: scans.scanType,
          method: scans.method,
          barcode: scans.barcode,
          result: scans.result,
          notes: scans.notes,
          deviceInfo: scans.deviceInfo,
          deviceName: devices.name,
          scannedAt: scans.scannedAt,
          attendeeName: tickets.attendeeName,
          attendeeEmail: tickets.attendeeEmail,
          guestFirstName: guests.firstName,
          guestLastName: guests.lastName,
          guestType: guests.guestType,
        })
        .from(scans)
        .leftJoin(tickets, eq(scans.ticketId, tickets.id))
        .leftJoin(guests, eq(tickets.guestId, guests.id))
        .leftJoin(devices, eq(scans.deviceId, devices.id))
        .where(and(...filters))
        .orderBy(desc(scans.scannedAt))
        .limit(input.limit)
        .offset(input.offset);

      const [countResult] = await ctx.db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(scans)
        .where(and(...filters));

      return {
        scans: rows,
        total: Number(countResult?.count ?? 0),
      };
    }),

  arrivals: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        search: z.string().optional(),
        action: z.enum(["check_in", "checkout", "invalid"]).optional(),
        limit: z.number().min(1).max(500).default(100),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return getArrivals(ctx.db, {
        eventId: input.eventId,
        companyId: ctx.companyId,
        search: input.search,
        action: input.action,
        limit: input.limit,
        offset: input.offset,
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        ticketId: z.string().uuid().optional(),
        deviceId: z.string().optional(),
        barcode: z.string().optional(),
        scanType: z.enum(["check_in", "checkout", "invalid"]).default("check_in"),
        method: z.enum(["scan", "search", "manual", "walkup"]).default("scan"),
        result: z.string().optional(),
        notes: z.string().optional(),
        deviceInfo: z.record(z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [scan] = await ctx.db
        .insert(scans)
        .values({
          companyId: ctx.companyId,
          eventId: input.eventId,
          ticketId: input.ticketId,
          deviceId: input.deviceId,
          barcode: input.barcode,
          scanType: input.scanType,
          method: input.method,
          result: input.result,
          notes: input.notes,
          deviceInfo: input.deviceInfo ?? {},
        })
        .returning();

      return scan;
    }),
});
