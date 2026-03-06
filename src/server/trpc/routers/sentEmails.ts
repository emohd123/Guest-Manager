import { router, protectedProcedure } from "../index";
import { z } from "zod";
import { sentEmails } from "../../db/schema/sent-emails";
import { guests, events, tickets, ticketTypes } from "../../db/schema";
import { eq, desc, and, isNotNull } from "drizzle-orm";
import { format } from "date-fns";
import { sendTicketEmail } from "../../actions/email";
import { Resend } from "resend";

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
      const email = guestData.email;
      if (!email) throw new Error("Guest has no email address. Cannot resend.");

      const result = await sendTicketEmail({
        toEmail: email,
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

  syncStatus: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const resendApiKey = process.env.RESEND_API_KEY;
      if (!resendApiKey) throw new Error("RESEND_API_KEY not configured.");

      const resend = new Resend(resendApiKey);

      // Get all sent emails for this event that have a resendId
      const rows = await ctx.db
        .select()
        .from(sentEmails)
        .where(and(eq(sentEmails.eventId, input.eventId), isNotNull(sentEmails.resendId)));

      let synced = 0;
      for (const row of rows) {
        try {
          const { data, error } = await resend.emails.get(row.resendId!);
          if (error || !data) continue;

          const lastEvent = (data as any).last_event as string | undefined;
          if (!lastEvent) continue;

          const updates: Record<string, unknown> = { updatedAt: new Date() };

          switch (lastEvent) {
            case "sent":
              updates.state = "Sending";
              break;
            case "delivered":
              updates.state = "Delivered";
              break;
            case "bounced":
            case "failed":
              updates.state = "Bounced";
              updates.reason = lastEvent;
              break;
            case "opened":
              updates.state = "Delivered";
              updates.status = "Opened";
              // Increment openCount only if it hasn't been set yet
              if ((row.openCount ?? 0) === 0) updates.openCount = 1;
              break;
            case "clicked":
              updates.state = "Delivered";
              updates.status = "Clicked";
              if ((row.clickCount ?? 0) === 0) updates.clickCount = 1;
              break;
            case "complained":
              updates.state = "Spam Complaint";
              break;
          }

          await ctx.db
            .update(sentEmails)
            .set(updates)
            .where(eq(sentEmails.id, row.id));

          synced++;
        } catch (e) {
          console.error(`[syncStatus] Failed to sync email ${row.id}:`, e);
        }
      }

      return { synced };
    }),
});
