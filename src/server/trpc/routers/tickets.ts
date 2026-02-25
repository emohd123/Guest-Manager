import { z } from "zod";
import { router, protectedProcedure } from "../index";
import { tickets, ticketTypes, orders, events } from "@/server/db/schema";
import { eq, and, desc, ilike, or, sql } from "drizzle-orm";
import { generateAndSendTicket } from "@/server/actions/generateAndSendTicket";

export const ticketsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        search: z.string().optional(),
        status: z.enum(["valid", "voided", "expired", "used"]).optional(),
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const filters = [
        eq(tickets.companyId, ctx.companyId),
        eq(tickets.eventId, input.eventId),
      ];

      if (input.status) {
        filters.push(eq(tickets.status, input.status));
      }

      if (input.search) {
        filters.push(
          or(
            ilike(tickets.attendeeName, `%${input.search}%`),
            ilike(tickets.attendeeEmail, `%${input.search}%`),
            ilike(tickets.barcode, `%${input.search}%`)
          )!
        );
      }

      const results = await ctx.db
        .select({
          id: tickets.id,
          barcode: tickets.barcode,
          attendeeName: tickets.attendeeName,
          attendeeEmail: tickets.attendeeEmail,
          status: tickets.status,
          checkedIn: tickets.checkedIn,
          checkedInAt: tickets.checkedInAt,
          pdfUrl: tickets.pdfUrl,
          ticketTypeName: ticketTypes.name,
          orderNumber: orders.orderNumber,
          createdAt: tickets.createdAt,
        })
        .from(tickets)
        .leftJoin(ticketTypes, eq(tickets.ticketTypeId, ticketTypes.id))
        .leftJoin(orders, eq(tickets.orderId, orders.id))
        .where(and(...filters))
        .orderBy(desc(tickets.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(tickets)
        .where(and(...filters));

      return {
        tickets: results,
        total: Number(countResult[0].count),
      };
    }),

  getByBarcode: protectedProcedure
    .input(z.object({ barcode: z.string(), eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [ticket] = await ctx.db
        .select({
          id: tickets.id,
          barcode: tickets.barcode,
          status: tickets.status,
          attendeeName: tickets.attendeeName,
          attendeeEmail: tickets.attendeeEmail,
          guestId: tickets.guestId,
          ticketTypeId: tickets.ticketTypeId,
          ticketTypeName: ticketTypes.name,
        })
        .from(tickets)
        .leftJoin(ticketTypes, eq(tickets.ticketTypeId, ticketTypes.id))
        .where(
          and(
            eq(tickets.barcode, input.barcode),
            eq(tickets.eventId, input.eventId),
            eq(tickets.companyId, ctx.companyId)
          )
        )
        .limit(1);

      return ticket ?? null;
    }),

  // Resend a ticket email with PDF to the attendee
  sendEmail: protectedProcedure
    .input(z.object({ ticketId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select({
          ticket: tickets,
          ticketTypeName: ticketTypes.name,
          orderNumber: orders.orderNumber,
          event: events,
        })
        .from(tickets)
        .leftJoin(ticketTypes, eq(tickets.ticketTypeId, ticketTypes.id))
        .leftJoin(orders, eq(tickets.orderId, orders.id))
        .leftJoin(events, eq(tickets.eventId, events.id))
        .where(
          and(
            eq(tickets.id, input.ticketId),
            eq(tickets.companyId, ctx.companyId)
          )
        )
        .limit(1);

      if (!row) throw new Error("Ticket not found");
      const { ticket, ticketTypeName, orderNumber, event } = row;
      if (!ticket.attendeeEmail) throw new Error("Ticket has no attendee email");

      const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

      await generateAndSendTicket({
        ticketId: ticket.id,
        toEmail: ticket.attendeeEmail,
        attendeeName: ticket.attendeeName ?? "Attendee",
        ticketTypeName: ticketTypeName ?? "General Admission",
        orderNumber: orderNumber ?? ticket.barcode,
        barcode: ticket.barcode,
        eventName: event?.title ?? "Event",
        eventStartsAt: event?.startsAt ?? new Date(),
        appBaseUrl,
        eventSettings: event?.settings,
      });

      return { success: true };
    }),
});
