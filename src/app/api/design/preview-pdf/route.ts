// src/app/api/design/preview-pdf/route.ts
// Generates a sample-data PDF ticket using the current event design settings
// Used by the design editor "Download PDF" button to preview what the real ticket will look like

import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { TicketPDFDocument, type TicketPDFData, type TicketPDFDesign } from "@/lib/pdf/TicketPDF";
import React from "react";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      design: TicketPDFDesign;
      eventName?: string;
      venue?: string;
      startDate?: string;
    };

    const { design, eventName, venue, startDate } = body;

    // Generate a sample QR code
    const qrCodeDataUri = await QRCode.toDataURL("PREVIEW-SAMPLE-001", {
      width: 150,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    });

    const sampleDate = startDate
      ? new Date(startDate).toLocaleDateString("en-US", {
          year: "numeric", month: "long", day: "numeric",
        })
      : new Date().toLocaleDateString("en-US", {
          year: "numeric", month: "long", day: "numeric",
        });

    const pdfData: TicketPDFData = {
      eventName:    eventName ?? "Sample Event",
      ticketType:   "General Admission",
      venue:        venue ?? "Gulf Hotel - ALDANA Hall",
      startDate:    sampleDate,
      attendeeName: "John Doe",
      price:        "Free",
      orderNumber:  "PREVIEW-001",
      qrCodeDataUri,
      design,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await (renderToBuffer as any)(
      React.createElement(TicketPDFDocument, { data: pdfData })
    ) as Buffer;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="ticket-design-preview.pdf"`,
        "Cache-Control":       "no-store",
      },
    });
  } catch (error) {
    console.error("[preview-pdf] error:", error);
    return NextResponse.json(
      { error: "Failed to generate preview PDF" },
      { status: 500 }
    );
  }
}
