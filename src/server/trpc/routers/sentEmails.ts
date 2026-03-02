import { router, protectedProcedure } from "../index";
import { z } from "zod";
import { sentEmails } from "../../db/schema/sent-emails";
import { guests, events, tickets, ticketTypes } from "../../db/schema";
import { eq, desc, and } from "drizzle-orm";
import { format } from "date-fns";
import { sendTicketEmail } from "../../actions/email";

export const sentEmailsRouter = router({
  list: protectedProcedure
    .input(z.object({
      eventId: z.string(),
      limit: z.number().optional().default(50),
    }))
    .query(async ({ ctx, input }) => {
      const results = await ctx.db
        .select()
        .from(sentEmails)
        .where(eq(sentEmails.eventId, input.eventId))
        .orderBy(desc(sentEmails.createdAt))
        .limit(input.limit);
        
      return {
        emails: results
      };
    }),

  resend: protectedProcedure
    .input(z.object({ emailAddress: z.string(), eventId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [guestData] = await ctx.db.select().from(guests)
        .where(and(eq(guests.eventId, input.eventId), eq(guests.email, input.emailAddress)))
        .limit(1);
        
      if (!guestData) throw new Error("Guest not found for this email address. Cannot resend.");
      
      const [eventData] = await ctx.db.select().from(events).where(eq(events.id, input.eventId)).limit(1);
      if (!eventData) throw new Error("Event not found.");
      
      const ticketResult = await ctx.db.select({ ticket: tickets, ticketType: ticketTypes })
        .from(tickets)
        .leftJoin(ticketTypes, eq(tickets.ticketTypeId, ticketTypes.id))
        .where(and(eq(tickets.guestId, guestData.id), eq(tickets.eventId, input.eventId)))
        .orderBy(desc(tickets.createdAt))
        .limit(1);
        
      const ticketData = ticketResult[0]?.ticket;
      const ticketTypeData = ticketResult[0]?.ticketType;
      
      if (!ticketData) throw new Error("No ticket found for this guest. Cannot resend.");
      
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
        orderNumber: ticketData.barcode,
        barcode: ticketData.barcode,
        eventDate,
        eventTime,
        ticketUrl,
        emailDesign: settings.emailDesign,
        ticketDesign: settings.ticketDesign,
      });

      if (!result.success) {
         if (result.code === "EMAIL_NOT_CONFIGURED") {
           throw new Error("Email service is not configured.");
         }
         throw new Error("Failed to send email");
      }
      return { success: true };
    }),
});
