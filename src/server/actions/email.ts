import { Resend } from "resend";
import TicketEmail from "@/emails/TicketEmail";
import { generateQRCodeDataUri } from "../utils/qrcode";

// Initialize Resend with the API key from environment variables
// It will fall back to a mock mode if the active key is not set
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

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
}: SendTicketEmailParams) {
  try {
    // Generate the QR code data URI from the barcode
    const qrCodeDataUri = await generateQRCodeDataUri(barcode);

    // Provide default fallback values if date/time/location aren't perfectly formatted yet
    const emailHtml = TicketEmail({
      eventName,
      attendeeName,
      ticketName,
      orderNumber,
      qrCodeDataUri,
      eventDate: eventDate ?? "TBD",
      eventTime: eventTime ?? "TBD",
      eventLocation: eventLocation ?? "Check your dashboard for location",
    });

    if (!resend) {
      console.log(
        "RESEND_API_KEY is not set. 📧 Mock email dispatch blocked. Would have sent to:",
        toEmail
      );
      return { success: true, mock: true };
    }

    const data = await resend.emails.send({
      from: "Guest Manager <onboarding@resend.dev>", // Typically you'd use a verified domain here
      to: [toEmail],
      subject: `Your ticket for ${eventName}`,
      react: emailHtml,
    });

    return { success: true, data };
  } catch (error) {
    console.error("Error sending ticket email:", error);
    return { success: false, error };
  }
}
