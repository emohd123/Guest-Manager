import { Resend } from "resend";
import TicketEmail from "@/emails/TicketEmail";
import { generateAndUploadQRCode } from "../utils/qrcode";
import { getDb } from "@/server/db";
import { tickets, sentEmails } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface EmailDesign {
  headerImageUrl?: string;
  senderName?: string;
  replyTo?: string;
  bodyHtml?: string;
}

export interface TicketDesignSettings {
  labelColor?: string;
  visibleFields?: {
    eventName?: boolean;
    ticketType?: boolean;
    venue?: boolean;
    startDate?: boolean;
    attendeeName?: boolean;
    barcode?: boolean;
    price?: boolean;
    orderNumber?: boolean;
  };
}

interface SendTicketEmailParams {
  toEmail: string;
  eventName: string;
  attendeeName: string;
  ticketName: string;
  orderNumber: string;
  barcode: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  ticketUrl?: string;
  // Design settings from event.settings
  emailDesign?: EmailDesign;
  ticketDesign?: TicketDesignSettings;
}

type SendTicketEmailResult =
  | {
      success: true;
      data: unknown;
    }
  | {
      success: false;
      code: "EMAIL_NOT_CONFIGURED" | "EMAIL_SEND_FAILED";
      error: unknown;
    };

export async function sendTicketEmail({
  toEmail,
  eventName,
  attendeeName,
  ticketName,
  orderNumber,
  barcode,
  eventDate,
  eventTime,
  eventLocation,
  ticketUrl,
  emailDesign,
  ticketDesign,
}: SendTicketEmailParams): Promise<SendTicketEmailResult> {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      const configError = new Error(
        "Email service is not configured. Set RESEND_API_KEY in .env.local and restart the server."
      );
      console.error("RESEND_API_KEY is not set. Email send blocked for:", toEmail);
      return {
        success: false,
        code: "EMAIL_NOT_CONFIGURED",
        error: configError,
      };
    }

    const resend = new Resend(resendApiKey);

    // Generate QR code as a hosted public URL (data: URIs are blocked by email clients)
    const qrCodeDataUri = await generateAndUploadQRCode(barcode);

    const senderName = emailDesign?.senderName || "Guest Manager";
    const replyTo = emailDesign?.replyTo;
    const configuredFrom = process.env.RESEND_FROM_EMAIL?.trim();
    const fromEmail =
      configuredFrom && configuredFrom !== "noreply@yourdomain.com"
        ? configuredFrom
        : "onboarding@resend.dev";

    // Build the email component with design settings applied
    const emailComponent = TicketEmail({
      eventName,
      attendeeName,
      ticketName,
      orderNumber,
      qrCodeDataUri,
      eventDate: eventDate ?? "TBD",
      eventTime: eventTime ?? "TBD",
      eventLocation: eventLocation ?? "TBD",
      ticketUrl: ticketUrl ?? "#",
      headerImageUrl: emailDesign?.headerImageUrl,
      labelColor: ticketDesign?.labelColor ?? "#2563EB",
      senderName,
      customBodyHtml: emailDesign?.bodyHtml,
      visibleFields: ticketDesign?.visibleFields ?? {
        eventName: true,
        ticketType: true,
        venue: true,
        startDate: true,
        attendeeName: true,
        barcode: true,
      },
    });

    const sendOptions: Parameters<typeof resend.emails.send>[0] = {
      from: `${senderName} <${fromEmail}>`,
      to: [toEmail],
      subject: `Your ticket for ${eventName}`,
      react: emailComponent,
    };

    if (replyTo) {
      sendOptions.replyTo = replyTo;
    }

    if (ticketUrl) {
      try {
        const pdfResponse = await fetch(ticketUrl);
        if (pdfResponse.ok) {
          const pdfBuffer = await pdfResponse.arrayBuffer();
          sendOptions.attachments = [
            {
              filename: `ticket-${barcode}.pdf`,
              content: Buffer.from(pdfBuffer),
            },
          ];
        } else {
          console.error("Failed to fetch PDF for attachment", pdfResponse.status);
        }
      } catch (err) {
        console.error("Error fetching PDF for attachment:", err);
      }
    }

    const data = await resend.emails.send(sendOptions);

    try {
      const db = getDb();
      // Try to find the event from the barcode
      const ticketResult = await db.select({ eventId: tickets.eventId }).from(tickets).where(eq(tickets.barcode, barcode)).limit(1);
      const eventId = ticketResult[0]?.eventId;

      if (eventId) {
        await db.insert(sentEmails).values({
          id: nanoid(),
          eventId,
          emailAddress: toEmail,
          subject: sendOptions.subject as string,
          type: "Ticket sent",
          state: "Delivered",
          status: "Unopened",
          resendId: data.data?.id,
        });
      }
    } catch (logErr) {
      console.error("Failed to log email to db:", logErr);
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending ticket email:", error);
    return {
      success: false,
      code: "EMAIL_SEND_FAILED",
      error,
    };
  }
}
