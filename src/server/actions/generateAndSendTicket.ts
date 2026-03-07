// generateAndSendTicket.ts
// A server utility called after ticket creation:
// 1. Generates a PDF ticket via @react-pdf/renderer
// 2. Uploads it to Supabase storage
// 3. Updates tickets.pdf_url
// 4. Sends the ticket email with the PDF attached via Resend

import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import React, { type ReactElement } from "react";
import { createClient } from "@supabase/supabase-js";
import { format } from "date-fns";
import { Resend } from "resend";
import { render } from "@react-email/components";
import { nanoid } from "nanoid";
import { generateQRCodeDataUri, generateAndUploadQRCode } from "@/server/utils/qrcode";
import { TicketPDFDocument } from "@/lib/pdf/TicketPDF";
import { AgendaPDFDocument } from "@/lib/pdf/AgendaPDF";
import TicketEmail from "@/emails/TicketEmail";
import { getDb } from "@/server/db";
import { tickets, sentEmails } from "@/server/db/schema";
import { eq } from "drizzle-orm";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface TicketEmailPayload {
  ticketId: string;
  toEmail: string;
  attendeeName: string;
  ticketTypeName: string;
  orderNumber: string;
  barcode: string;
  eventName: string;
  eventStartsAt: Date;
  eventLocation?: string;
  appBaseUrl: string;
  // From event.settings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eventSettings?: any;
  /** Unique visitor code for this event (shown on ticket when showVisitorCode is enabled) */
  visitorCode?: string;
}

export async function generateAndSendTicket(payload: TicketEmailPayload): Promise<void> {
  const {
    ticketId,
    toEmail,
    attendeeName,
    ticketTypeName,
    orderNumber,
    barcode,
    eventName,
    eventStartsAt,
    eventLocation,
    appBaseUrl,
    eventSettings,
    visitorCode,
  } = payload;

  const settings = eventSettings ?? {};
  const ticketDesign = settings.ticketDesign ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const emailDesigns = settings.emailDesigns ?? {} as any;
  const ticketSentEmail = emailDesigns.ticket_sent ?? {};
  const agendaSettings = settings.agenda ?? { items: [], attachToEmail: false };

  const formattedDate = format(eventStartsAt, "MMM d, yyyy");
  const formattedTime = format(eventStartsAt, "h:mm a");
  const formattedDateTime = format(eventStartsAt, "MMM d, yyyy • h:mm a");

  // App download URL for QR code (shown next to visitor code on ticket)
  const appDownloadUrl = process.env.NEXT_PUBLIC_APP_DOWNLOAD_URL || "http://localhost:8081";

  // 1. Generate QR codes — ticket barcode + app download link
  const [qrCodePublicUrl, qrCodeDataUri, appDownloadQrUri] = await Promise.all([
    generateAndUploadQRCode(barcode),
    generateQRCodeDataUri(barcode),
    ticketDesign.showVisitorCode !== false && visitorCode
      ? generateQRCodeDataUri(appDownloadUrl)
      : Promise.resolve(undefined),
  ]);

  // 2. Generate PDF
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pdfBuffer: any = null;
  let pdfPublicUrl: string | undefined;

  try {
    const element = React.createElement(TicketPDFDocument, {
      data: {
        eventName,
        ticketType: ticketTypeName,
        venue: eventLocation,
        startDate: formattedDateTime,
        attendeeName,
        orderNumber,
        qrCodeDataUri,
        visitorCode: ticketDesign.showVisitorCode !== false ? visitorCode : undefined,
        appDownloadQrUri: appDownloadQrUri ?? undefined,
        design: {
          backgroundImageUrl: ticketDesign.backgroundImageUrl,
          labelColor: ticketDesign.labelColor ?? "#2563EB",
          textColor: ticketDesign.textColor ?? "#111111",
          visibleFields: ticketDesign.visibleFields,
          showVisitorCode: ticketDesign.showVisitorCode ?? true,
        },
      },
    }) as ReactElement<DocumentProps>;
    pdfBuffer = await renderToBuffer(element);
  } catch (pdfErr) {
    console.error("[generateAndSendTicket] PDF render failed:", pdfErr);
    // Continue without PDF — still send email
  }

  // 3. Upload PDF and update db
  if (pdfBuffer) {
    try {
      const filePath = `tickets/${ticketId}.pdf`;
      const { error: uploadErr } = await supabaseAdmin.storage
        .from("events")
        .upload(filePath, pdfBuffer, {
          contentType: "application/pdf",
          upsert: true,
          cacheControl: "3600",
        });

      if (!uploadErr) {
        const { data: urlData } = supabaseAdmin.storage
          .from("events")
          .getPublicUrl(filePath);
        pdfPublicUrl = urlData.publicUrl;

        const db = getDb();
        await db
          .update(tickets)
          .set({ pdfUrl: pdfPublicUrl, updatedAt: new Date() })
          .where(eq(tickets.id, ticketId));
      } else {
        console.error("[generateAndSendTicket] PDF upload failed:", uploadErr);
      }
    } catch (uploadErr2) {
      console.error("[generateAndSendTicket] PDF upload exception:", uploadErr2);
    }
  }

  // 3b. Optionally generate/fetch agenda PDF
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let agendaBuffer: any = null;
  if (agendaSettings.attachToEmail) {
    const agendaMode = agendaSettings.mode ?? "design";

    if (agendaMode === "upload" && agendaSettings.uploadedPdfUrl) {
      // Fetch the already-uploaded PDF and attach it as buffer
      try {
        const res = await fetch(agendaSettings.uploadedPdfUrl);
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          agendaBuffer = Buffer.from(arrayBuffer);
          console.log("[generateAndSendTicket] Agenda fetched from uploaded URL");
        } else {
          console.error("[generateAndSendTicket] Failed to fetch uploaded agenda PDF:", res.status);
        }
      } catch (fetchErr) {
        console.error("[generateAndSendTicket] Agenda fetch exception:", fetchErr);
      }
    } else if (agendaMode === "design" && agendaSettings.items?.length > 0) {
      // Generate agenda PDF from the designed schedule
      try {
        const agendaElement = React.createElement(AgendaPDFDocument, {
          title: agendaSettings.agendaTitle,
          eventName,
          items: agendaSettings.items,
        }) as ReactElement<DocumentProps>;
        agendaBuffer = await renderToBuffer(agendaElement);
        console.log("[generateAndSendTicket] Agenda PDF generated from schedule");
      } catch (agendaErr) {
        console.error("[generateAndSendTicket] Agenda PDF render failed:", agendaErr);
      }
    }
  }

  // 4. Send ticket email
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.log("[generateAndSendTicket] RESEND_API_KEY not set — skipping email");
    return;
  }

  const resend = new Resend(resendApiKey);
  const senderName = ticketSentEmail.senderName ?? "Guest Manager";
  const configuredFrom = process.env.RESEND_FROM_EMAIL?.trim();
  const fromEmail =
    configuredFrom && configuredFrom !== "noreply@yourdomain.com"
      ? configuredFrom
      : "onboarding@resend.dev";
  const ticketUrl = pdfPublicUrl ?? `${appBaseUrl}/api/tickets/${ticketId}/pdf`;

  const emailHtml = TicketEmail({
    eventName,
    attendeeName,
    ticketName: ticketTypeName,
    orderNumber,
    qrCodeDataUri: qrCodePublicUrl,
    eventDate: formattedDate,
    eventTime: formattedTime,
    eventLocation,
    ticketUrl,
    headerImageUrl: ticketSentEmail.headerImageUrl,
    labelColor: ticketDesign.labelColor ?? "#2563EB",
    senderName,
    customBodyHtml: ticketSentEmail.bodyHtml,
    visibleFields: ticketDesign.visibleFields ?? {
      eventName: true,
      ticketType: true,
      venue: true,
      startDate: true,
      attendeeName: true,
      barcode: true,
    },
  });

  const emailHtmlRaw = await render(emailHtml);

  const sendOptions: Parameters<typeof resend.emails.send>[0] = {
    from: `${senderName} <${fromEmail}>`,
    to: [toEmail],
    subject: `Your ticket for ${eventName}`,
    html: emailHtmlRaw,
    attachments: [
      ...(pdfBuffer
        ? [
            {
              filename: `ticket-${orderNumber}.pdf`,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              content: (pdfBuffer as any).toString("base64") as string,
            },
          ]
        : []),
      ...(agendaBuffer
        ? [
            {
              filename: `agenda-${eventName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.pdf`,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              content: (agendaBuffer as any).toString("base64") as string,
            },
          ]
        : []),
    ],
  };

  if (ticketSentEmail.replyTo) {
    sendOptions.replyTo = ticketSentEmail.replyTo;
  }

  try {
    const data = await resend.emails.send(sendOptions);
    console.log(`[generateAndSendTicket] Email sent to ${toEmail}`);
    
    // Log the sent email to the database
    try {
      const db = getDb();
      const ticketResult = await db.select({ eventId: tickets.eventId }).from(tickets).where(eq(tickets.id, ticketId)).limit(1);
      const eventId = ticketResult[0]?.eventId;

      if (eventId) {
        await db.insert(sentEmails).values({
          id: nanoid(),
          eventId,
          emailAddress: toEmail,
          subject: sendOptions.subject as string,
          type: "Ticket sent",
          state: "Sending",
          status: "Unopened",
          resendId: data.data?.id,
        });
      }
    } catch (logErr) {
      console.error("[generateAndSendTicket] Failed to log email to db:", logErr);
    }
  } catch (emailErr) {
    console.error("[generateAndSendTicket] Email send failed:", emailErr);
  }
}
