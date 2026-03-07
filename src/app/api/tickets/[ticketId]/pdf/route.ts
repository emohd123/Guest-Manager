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
};

type TicketTypeRow = {
  id: string;
  name: string | null;
};

type EventRow = {
  id: string;
  title: string;
  starts_at: string | null;
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
      .select("id,event_id,ticket_type_id,order_id,barcode,pdf_url,attendee_name")
      .eq("id", ticketId)
      .maybeSingle();

    if (ticketError) {
      throw new Error(ticketError.message);
    }

    if (!ticketData) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const ticket = ticketData as TicketRow;

    if (ticket.pdf_url) {
      return NextResponse.redirect(ticket.pdf_url);
    }

    const qrCodeDataUri = await generateQRCodeDataUri(ticket.barcode);

    const [eventResult, ticketTypeResult, orderResult] = await Promise.all([
      supabase
        .from("events")
        .select("id,title,starts_at,settings")
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
    const ticketDesign = (settings.ticketDesign ?? {}) as Record<string, any>;
    const formattedDate = event?.starts_at
      ? format(new Date(event.starts_at), "MMM d, yyyy • h:mm a")
      : undefined;

    const pdfElement = React.createElement(TicketPDFDocument, {
      data: {
        eventName: event?.title ?? "Event",
        ticketType: ticketType?.name ?? "General Admission",
        startDate: formattedDate,
        attendeeName: ticket.attendee_name ?? "Attendee",
        orderNumber: order?.order_number ?? ticket.barcode,
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
