import { z } from "zod";
import { router, protectedProcedure } from "../index";
import { guests, tickets, events, ticketTypes } from "@/server/db/schema";
import { eq, and, desc, ilike, sql, or, inArray } from "drizzle-orm";
import { sendTicketEmail } from "@/server/actions/email";
import { format } from "date-fns";
import crypto from "crypto";
import { processScanWorkflow } from "@/server/services/checkin";

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

      const guestsList = await ctx.db
        .select()
        .from(guests)
        .where(and(...filters))
        .orderBy(desc(guests.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const guestIds = guestsList.map((g) => g.id);
      
      let ticketsList: (typeof tickets.$inferSelect)[] = [];
      if (guestIds.length > 0) {
        ticketsList = await ctx.db
          .select()
          .from(tickets)
          .where(
            and(
              inArray(tickets.guestId, guestIds),
              eq(tickets.eventId, input.eventId)
            )
          );
      }

      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(guests)
        .where(and(...filters));

      return {
        guests: guestsList.map((guest) => {
          const ticket = ticketsList.find((t) => t.guestId === guest.id);
          return {
            ...guest,
            ticket: ticket || null,
          };
        }),
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
      const [guest] = await ctx.db
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

      if (!guest) throw new Error("Guest not found for this event");

      if (guest.status === "checked_in") {
        return { guest, alreadyCheckedIn: true };
      }

      // Find associated ticket for this guest and run canonical scan workflow.
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

      if (ticket) {
        const scanResult = await processScanWorkflow(ctx.db, {
          eventId: input.eventId,
          barcode: ticket.barcode,
          action: "check_in",
          method: input.barcode ? "scan" : "manual",
          actor: {
            companyId: ctx.companyId,
            userId: ctx.userId,
            deviceId: (input.deviceInfo?.deviceId as string | undefined) ?? null,
            deviceName: (input.deviceInfo?.deviceName as string | undefined) ?? null,
          },
        });

        const [updatedGuest] = await ctx.db
          .select()
          .from(guests)
          .where(eq(guests.id, input.guestId))
          .limit(1);

        return { guest: updatedGuest ?? guest, alreadyCheckedIn: scanResult.status === "revalidated" };
      }

      // Fallback for guest records without ticket linkage.
      const [updatedGuest] = await ctx.db
        .update(guests)
        .set({
          status: "checked_in",
          checkedInAt: new Date(),
          checkedOutAt: null,
          attendanceState: "checked_in",
          updatedAt: new Date(),
        })
        .where(eq(guests.id, input.guestId))
        .returning();

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
      const [linkedTicket] = await ctx.db
        .select()
        .from(tickets)
        .where(
          and(
            eq(tickets.guestId, input.guestId),
            eq(tickets.eventId, input.eventId)
          )
        )
        .limit(1);

      if (linkedTicket) {
        await processScanWorkflow(ctx.db, {
          eventId: input.eventId,
          barcode: linkedTicket.barcode,
          action: "checkout",
          method: "manual",
          actor: {
            companyId: ctx.companyId,
            userId: ctx.userId,
          },
        });
      }

      const [updatedGuest] = await ctx.db
        .update(guests)
        .set({
          status: "confirmed",
          checkedOutAt: new Date(),
          attendanceState: "checked_out",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(guests.id, input.guestId),
            eq(guests.eventId, input.eventId),
            eq(guests.companyId, ctx.companyId)
          )
        )
        .returning();

      if (!updatedGuest) throw new Error("Guest not found");

      return { guest: updatedGuest };
    }),

  sendTicketEmail: protectedProcedure
    .input(z.object({ guestId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const guestResult = await ctx.db
        .select({
          guest: guests,
          event: events,
        })
        .from(guests)
        .leftJoin(events, eq(guests.eventId, events.id))
        .where(and(eq(guests.id, input.guestId), eq(guests.companyId, ctx.companyId)))
        .limit(1);

      const guestRow = guestResult[0];
      if (!guestRow) throw new Error("Guest not found");

      const guestData = guestRow.guest;
      const eventData = guestRow.event;
      if (!guestData.email) {
        throw new Error("Guest does not have an email address.");
      }

      const ticketResult = await ctx.db
        .select({
          ticket: tickets,
          ticketType: ticketTypes,
        })
        .from(tickets)
        .leftJoin(ticketTypes, eq(tickets.ticketTypeId, ticketTypes.id))
        .where(
          and(
            eq(tickets.guestId, input.guestId),
            eq(tickets.eventId, guestData.eventId),
            eq(tickets.companyId, ctx.companyId)
          )
        )
        .orderBy(desc(tickets.createdAt))
        .limit(1);

      let ticketData = ticketResult[0]?.ticket;
      let ticketTypeData = ticketResult[0]?.ticketType;

      // If this guest does not yet have a ticket, create one on-demand.
      if (!ticketData) {
        let fallbackTicketType: typeof ticketTypes.$inferSelect | undefined;

        // Prefer an active ticket type for the event.
        [fallbackTicketType] = await ctx.db
          .select()
          .from(ticketTypes)
          .where(
            and(
              eq(ticketTypes.eventId, guestData.eventId),
              eq(ticketTypes.companyId, ctx.companyId),
              eq(ticketTypes.status, "active")
            )
          )
          .orderBy(desc(ticketTypes.createdAt))
          .limit(1);

        // If none is active, use any existing ticket type for the event.
        if (!fallbackTicketType) {
          [fallbackTicketType] = await ctx.db
            .select()
            .from(ticketTypes)
            .where(
              and(
                eq(ticketTypes.eventId, guestData.eventId),
                eq(ticketTypes.companyId, ctx.companyId)
              )
            )
            .orderBy(desc(ticketTypes.createdAt))
            .limit(1);
        }

        // If this event has no ticket types yet, create a default free type.
        if (!fallbackTicketType) {
          [fallbackTicketType] = await ctx.db
            .insert(ticketTypes)
            .values({
              eventId: guestData.eventId,
              companyId: ctx.companyId,
              name: "General Admission",
              description: "Auto-created for guest ticket delivery",
              price: 0,
              currency: "USD",
              status: "active",
            })
            .returning();
        }

        const barcode = `TKT-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
        const attendeeName = `${guestData.firstName ?? ""} ${guestData.lastName ?? ""}`.trim() || "Guest";

        [ticketData] = await ctx.db
          .insert(tickets)
          .values({
            companyId: ctx.companyId,
            eventId: guestData.eventId,
            ticketTypeId: fallbackTicketType.id,
            guestId: guestData.id,
            barcode,
            attendeeName,
            attendeeEmail: guestData.email,
            status: "valid",
          })
          .returning();

        ticketTypeData = fallbackTicketType;
      }

      if (!ticketData) {
        throw new Error("Failed to create or find ticket for guest.");
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const settings = (eventData?.settings as any) || {};

      const eventDate = eventData?.startsAt ? format(new Date(eventData.startsAt), "MMM d, yyyy") : undefined;
      const eventTime = eventData?.startsAt ? format(new Date(eventData.startsAt), "h:mm a") : undefined;
      
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const ticketUrl = `${baseUrl}/api/tickets/${ticketData.id}/pdf`;

      const result = await sendTicketEmail({
        toEmail: guestData.email,
        eventName: eventData?.title || "Event",
        attendeeName: `${guestData.firstName} ${guestData.lastName || ""}`.trim(),
        ticketName: ticketTypeData?.name || "General Admission",
        orderNumber: ticketData.barcode, // Fallback if no order ID is used
        barcode: ticketData.barcode,
        eventDate,
        eventTime,
        eventLocation: undefined, // Requires venue lookup, omit if unavailable here
        ticketUrl,
        emailDesign: settings.emailDesign,
        ticketDesign: settings.ticketDesign,
      });

      if (!result.success) {
        if (result.code === "EMAIL_NOT_CONFIGURED") {
          throw new Error("Email service is not configured. Add RESEND_API_KEY to .env.local and restart the app.");
        }
        const detail = result.error instanceof Error ? result.error.message : String(result.error);
        console.error("[sendTicketEmail] Resend error:", result.error);
        throw new Error(`Failed to send email: ${detail}`);
      }

      return result;
    }),
});
