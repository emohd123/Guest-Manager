import { router, protectedProcedure } from "../index";
import { z } from "zod";
import { format } from "date-fns";
import { sendTicketEmail } from "../../actions/email";
import { Resend } from "resend";
import { getAppUrl } from "@/lib/app-urls";

type SentEmailRow = {
  id: string;
  event_id: string | null;
  type: string;
  state: string;
  status: string;
  email_address: string;
  subject: string;
  resend_id: string | null;
  open_count: number;
  click_count: number;
  reason: string | null;
  created_at: string;
  updated_at: string;
};

type GuestRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  event_id: string;
};

type EventRow = {
  id: string;
  title: string;
  starts_at: string | null;
  settings: Record<string, unknown> | null;
};

type TicketRow = {
  id: string;
  barcode: string;
  ticket_type_id: string;
  guest_id: string | null;
  created_at: string;
};

function mapSentEmail(row: SentEmailRow) {
  return {
    id: row.id,
    eventId: row.event_id,
    type: row.type,
    state: row.state,
    status: row.status,
    emailAddress: row.email_address,
    subject: row.subject,
    resendId: row.resend_id,
    openCount: row.open_count,
    clickCount: row.click_count,
    reason: row.reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const sentEmailsRouter = router({
  list: protectedProcedure
    .input(z.object({
      eventId: z.string(),
      limit: z.number().optional().default(50),
    }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("sent_emails")
        .select("*")
        .eq("event_id", input.eventId)
        .order("created_at", { ascending: false })
        .limit(input.limit);

      if (error) throw new Error(error.message);

      return {
        emails: ((data ?? []) as SentEmailRow[]).map((row) => mapSentEmail(row)),
      };
    }),

  resend: protectedProcedure
    .input(z.object({ emailAddress: z.string(), eventId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { data: guestData, error: guestError } = await ctx.supabase
        .from("guests")
        .select("id,first_name,last_name,email,event_id")
        .eq("event_id", input.eventId)
        .eq("email", input.emailAddress)
        .eq("company_id", ctx.companyId)
        .limit(1)
        .maybeSingle();

      if (guestError) throw new Error(guestError.message);
      if (!guestData) throw new Error("Guest not found for this email address. Cannot resend.");

      const { data: eventData, error: eventError } = await ctx.supabase
        .from("events")
        .select("id,title,starts_at,settings")
        .eq("id", input.eventId)
        .eq("company_id", ctx.companyId)
        .maybeSingle();
      if (eventError) throw new Error(eventError.message);
      if (!eventData) throw new Error("Event not found.");

      const { data: ticketsData, error: ticketsError } = await ctx.supabase
        .from("tickets")
        .select("id,barcode,ticket_type_id,guest_id,created_at")
        .eq("guest_id", guestData.id)
        .eq("event_id", input.eventId)
        .eq("company_id", ctx.companyId)
        .order("created_at", { ascending: false })
        .limit(1);
      if (ticketsError) throw new Error(ticketsError.message);

      const ticketData = (ticketsData?.[0] as TicketRow | undefined) ?? null;
      if (!ticketData) throw new Error("No ticket found for this guest. Cannot resend.");

      const { data: ticketTypeData, error: ticketTypeError } = await ctx.supabase
        .from("ticket_types")
        .select("name")
        .eq("id", ticketData.ticket_type_id)
        .maybeSingle();
      if (ticketTypeError) throw new Error(ticketTypeError.message);

      const settings = (eventData.settings as Record<string, unknown> | null) ?? {};
      const eventDate = eventData.starts_at ? format(new Date(eventData.starts_at), "MMM d, yyyy") : undefined;
      const eventTime = eventData.starts_at ? format(new Date(eventData.starts_at), "h:mm a") : undefined;
      const baseUrl = getAppUrl();
      const ticketUrl = `${baseUrl}/api/tickets/${ticketData.id}/pdf`;
      const email = guestData.email;
      if (!email) throw new Error("Guest has no email address. Cannot resend.");

      const result = await sendTicketEmail({
        toEmail: email,
        eventName: eventData.title || "Event",
        attendeeName: `${guestData.first_name ?? ""} ${guestData.last_name || ""}`.trim(),
        ticketName: ticketTypeData?.name || "General Admission",
        orderNumber: ticketData.barcode,
        barcode: ticketData.barcode,
        eventDate,
        eventTime,
        ticketUrl,
        emailDesign: settings.emailDesign as Parameters<typeof sendTicketEmail>[0]["emailDesign"],
        ticketDesign: settings.ticketDesign as Parameters<typeof sendTicketEmail>[0]["ticketDesign"],
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

      const { data: rows, error } = await ctx.supabase
        .from("sent_emails")
        .select("*")
        .eq("event_id", input.eventId)
        .not("resend_id", "is", null);
      if (error) throw new Error(error.message);

      let synced = 0;
      for (const row of (rows ?? []) as SentEmailRow[]) {
        try {
          const { data, error: resendError } = await resend.emails.get(row.resend_id!);
          if (resendError || !data) continue;

          const lastEvent = (data as { last_event?: string }).last_event;
          if (!lastEvent) continue;

          const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

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
              if ((row.open_count ?? 0) === 0) updates.open_count = 1;
              break;
            case "clicked":
              updates.state = "Delivered";
              updates.status = "Clicked";
              if ((row.click_count ?? 0) === 0) updates.click_count = 1;
              break;
            case "complained":
              updates.state = "Spam Complaint";
              break;
          }

          const { error: updateError } = await ctx.supabase
            .from("sent_emails")
            .update(updates)
            .eq("id", row.id);
          if (updateError) throw new Error(updateError.message);

          synced++;
        } catch (e) {
          console.error(`[syncStatus] Failed to sync email ${row.id}:`, e);
        }
      }

      return { synced };
    }),
});
