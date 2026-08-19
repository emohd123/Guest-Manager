export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { format } from "date-fns";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import type { JSXElementConstructor, ReactElement } from "react";
import { TicketPDFDocument } from "@/lib/pdf/TicketPDF";
import { generateQRCodeDataUri } from "@/server/utils/qrcode";
import { createSupabaseAdminClient } from "@/server/supabase/admin";

type TicketRow = {
  id: string;
  event_id: string;
  ticket_type_id: string | null;
  order_id: string | null;
  barcode: string;
  pdf_url: string | null;
  attendee_name: string | null;
  metadata: Record<string, any> | null;
};

type TicketTypeRow = {
  id: string;
  name: string | null;
};

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string | null;
  ends_at: string | null;
  cover_image_url: string | null;
  visitor_code: string | null;
  settings: Record<string, unknown> | null;
};

type OrderRow = {
  id: string;
  order_number: string | null;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params;
    const supabase = createSupabaseAdminClient();

    const { data: ticketData, error: ticketError } = await supabase
      .from("tickets")
      .select("id,event_id,ticket_type_id,order_id,barcode,pdf_url,attendee_name,metadata")
      .eq("id", ticketId)
      .maybeSingle();

    if (ticketError) {
      throw new Error(ticketError.message);
    }

    if (!ticketData) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const ticket = ticketData as TicketRow;

    // Regenerate on demand so ticket design, event artwork, venue, and terms stay current.
    const qrCodeDataUri = await generateQRCodeDataUri(ticket.barcode);

    const [eventResult, ticketTypeResult, orderResult] = await Promise.all([
      supabase
        .from("events")
        .select("id,title,description,starts_at,ends_at,cover_image_url,visitor_code,settings")
        .eq("id", ticket.event_id)
        .maybeSingle(),
      ticket.ticket_type_id
        ? supabase
            .from("ticket_types")
            .select("id,name")
            .eq("id", ticket.ticket_type_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      ticket.order_id
        ? supabase
            .from("orders")
            .select("id,order_number")
            .eq("id", ticket.order_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (eventResult.error) {
      throw new Error(eventResult.error.message);
    }

    if (ticketTypeResult.error) {
      throw new Error(ticketTypeResult.error.message);
    }

    if (orderResult.error) {
      throw new Error(orderResult.error.message);
    }

    const event = eventResult.data as EventRow | null;
    const ticketType = ticketTypeResult.data as TicketTypeRow | null;
    const order = orderResult.data as OrderRow | null;

    const settings = (event?.settings ?? {}) as Record<string, any>;
    const publicPage = (settings.publicPage ?? {}) as Record<string, any>;
    const ticketDesign = (settings.ticketDesign ?? {}) as Record<string, any>;
    const terms = Array.isArray(publicPage.terms) && publicPage.terms.length
      ? publicPage.terms.filter((term: unknown): term is string => typeof term === "string")
      : [
          "QR tickets are valid once for the stated event and date.",
          "Entry is subject to venue and organiser safety rules.",
          "Unauthorized resale or copying of tickets is not permitted.",
        ];
    const venue = [publicPage.venueName, publicPage.locationText]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .join(" · ");
    const metadata = ticket.metadata ?? {};
    const seatCategory = metadata.seat?.categoryName ?? metadata.seat?.category ?? metadata.categoryName ?? metadata.ticketTypeName;
    const formattedDate = event?.starts_at
      ? format(new Date(event.starts_at), "MMM d, yyyy • h:mm a")
      : undefined;

    const pdfElement = React.createElement(TicketPDFDocument, {
      data: {
        eventName: event?.title ?? "Event",
        ticketType: ticketType?.name ?? (typeof seatCategory === "string" ? seatCategory : "General Admission"),
        venue: venue || undefined,
        startDate: formattedDate,
        description: (typeof publicPage.description === "string" && publicPage.description.trim()) || event?.description || undefined,
        terms,
        attendeeName: ticket.attendee_name ?? "Attendee",
        orderNumber: order?.order_number ?? ticket.barcode,
        qrCodeDataUri,
        design: {
          backgroundImageUrl: ticketDesign.backgroundImageUrl ?? event?.cover_image_url ?? publicPage.coverImage ?? publicPage.heroImage ?? undefined,
          labelColor: ticketDesign.labelColor ?? "#2563EB",
          textColor: ticketDesign.textColor ?? "#111111",
          showVisitorCode: ticketDesign.showVisitorCode,
          visibleFields: ticketDesign.visibleFields,
        },
        visitorCode: event?.visitor_code ?? undefined,
        seat: ticket.metadata?.seat
          ? `${ticket.metadata.seat.section} · Row ${ticket.metadata.seat.row} · Seat ${ticket.metadata.seat.seat}`
          : undefined,
      },
    }) as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>;

    const pdfBuffer = await renderToBuffer(pdfElement);

    const filePath = `tickets/${ticket.id}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("events")
      .upload(filePath, new Uint8Array(pdfBuffer), {
        contentType: "application/pdf",
        upsert: true,
        cacheControl: "3600",
      });

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from("events").getPublicUrl(filePath);
      await supabase
        .from("tickets")
        .update({
          pdf_url: urlData.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ticketId);
    } else {
      console.error("PDF upload error:", uploadError);
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=\"ticket-${ticket.barcode}.pdf\"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
