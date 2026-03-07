// /api/tickets/[ticketId]/pdf/route.ts
// Generates a PDF ticket, uploads it to Supabase storage, and serves the PDF.

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { tickets, ticketTypes, events, orders } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { generateQRCodeDataUri } from "@/server/utils/qrcode";
import { createClient } from "@supabase/supabase-js";
import { TicketPDFDocument } from "@/lib/pdf/TicketPDF";
import React from "react";
import type { DocumentProps } from "@react-pdf/renderer";
import type { ReactElement, JSXElementConstructor } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { format } from "date-fns";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params;
    const db = getDb();

    const [row] = await db
      .select({
        ticket: tickets,
        ticketType: ticketTypes,
        event: events,
        orderNumber: orders.orderNumber,
      })
      .from(tickets)
      .leftJoin(ticketTypes, eq(tickets.ticketTypeId, ticketTypes.id))
      .leftJoin(events, eq(tickets.eventId, events.id))
      .leftJoin(orders, eq(tickets.orderId, orders.id))
      .where(eq(tickets.id, ticketId))
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const { ticket, ticketType, event, orderNumber } = row;

    // If PDF already exists in storage, redirect
    if (ticket.pdfUrl) {
      return NextResponse.redirect(ticket.pdfUrl);
    }

    const qrCodeDataUri = await generateQRCodeDataUri(ticket.barcode);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const settings = (event?.settings as any) ?? {};
    const ticketDesign = settings.ticketDesign ?? {};

    const formattedDate = event?.startsAt
      ? format(new Date(event.startsAt), "MMM d, yyyy • h:mm a")
      : undefined;

    // Build the React PDF element with explicit type cast
    const pdfElement = React.createElement(TicketPDFDocument, {
      data: {
        eventName: event?.title ?? "Event",
        ticketType: ticketType?.name ?? "General Admission",
        startDate: formattedDate,
        attendeeName: ticket.attendeeName ?? "Attendee",
        orderNumber: orderNumber ?? ticket.barcode,
        qrCodeDataUri,
        design: {
          backgroundImageUrl: ticketDesign.backgroundImageUrl,
          labelColor: ticketDesign.labelColor ?? "#2563EB",
          textColor: ticketDesign.textColor ?? "#111111",
          visibleFields: ticketDesign.visibleFields,
        },
      },
    }) as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>;

    const pdfBuffer = await renderToBuffer(pdfElement);

    // Upload to Supabase storage
    const filePath = `tickets/${ticket.id}.pdf`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("events")
      .upload(filePath, new Uint8Array(pdfBuffer), {
        contentType: "application/pdf",
        upsert: true,
        cacheControl: "3600",
      });

    if (!uploadError) {
      const { data: urlData } = supabaseAdmin.storage
        .from("events")
        .getPublicUrl(filePath);

      await db
        .update(tickets)
        .set({ pdfUrl: urlData.publicUrl, updatedAt: new Date() })
        .where(eq(tickets.id, ticketId));
    } else {
      console.error("PDF upload error:", uploadError);
    }

    // Serve the PDF
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ticket-${ticket.barcode}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
