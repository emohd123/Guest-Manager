import { Resend } from "resend";
import TicketEmail from "@/emails/TicketEmail";
import { generateQRCodeDataUri } from "../utils/qrcode";

// Initialize Resend with the API key from environment variables
// It will fall back to a mock mode if the active key is not set
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

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
}: SendTicketEmailParams) {
  try {
    // Generate the QR code data URI from the barcode
    const qrCodeDataUri = await generateQRCodeDataUri(barcode);

    const senderName = emailDesign?.senderName || "Guest Manager";
    const replyTo = emailDesign?.replyTo;

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

    if (!resend) {
      console.log(
        "RESEND_API_KEY is not set. 📧 Mock email dispatch blocked. Would have sent to:",
        toEmail
      );
      return { success: true, mock: true };
    }

    const sendOptions: Parameters<typeof resend.emails.send>[0] = {
      from: `${senderName} <onboarding@resend.dev>`,
      to: [toEmail],
      subject: `Your ticket for ${eventName}`,
      react: emailComponent,
    };

    if (replyTo) {
      sendOptions.replyTo = replyTo;
    }

    const data = await resend.emails.send(sendOptions);

    return { success: true, data };
  } catch (error) {
    console.error("Error sending ticket email:", error);
    return { success: false, error };
  }
}
