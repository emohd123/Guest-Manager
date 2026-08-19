export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { format } from "date-fns";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import type { JSXElementConstructor, ReactElement } from "react";
import { TicketPDFDocument } from "@/lib/pdf/TicketPDF";
import { formatMoney } from "@/lib/marketplace";
import { generateQRCodeDataUri } from "@/server/utils/qrcode";
import { createTicketQrPayload, isTicketExpired } from "@/lib/ticket-qr";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { readSeatsIoChartKey, readSeatsIoEventKey, readSeatsIoObjectInfos, readSeatsIoPricing, seatsIoEventKeyFor } from "@/lib/seatsio";

type TicketRow = {
  id: string;
  event_id: string;
  ticket_type_id: string | null;
  order_id: string | null;
  barcode: string;
  pdf_url: string | null;
  attendee_name: string | null;
  metadata: Record<string, any> | null;
  status: string | null;
  checked_in: boolean | null;
};

type TicketTypeRow = {
  id: string;
  name: string | null;
  price: number | null;
  currency: string | null;
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
      .select("id,event_id,ticket_type_id,order_id,barcode,pdf_url,attendee_name,metadata,status,checked_in")
      .eq("id", ticketId)
      .maybeSingle();

    if (ticketError) {
      throw new Error(ticketError.message);
    }

    if (!ticketData) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const ticket = ticketData as TicketRow;

    const [eventResult, ticketTypeResult, orderResult] = await Promise.all([
      supabase
        .from("events")
        .select("id,title,description,starts_at,ends_at,cover_image_url,visitor_code,settings")
        .eq("id", ticket.event_id)
        .maybeSingle(),
      ticket.ticket_type_id
        ? supabase
            .from("ticket_types")
            .select("id,name,price,currency")
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
    const expiresAt = event?.ends_at ?? event?.starts_at ?? null;
    const ticketUsed = ticket.status === "used" || ticket.status === "checked_in" || ticket.checked_in === true;

    if (ticketUsed) {
      return NextResponse.json(
        {
          error: "This ticket has already been used. PDF downloads are no longer available.",
          code: "TICKET_USED",
          expiresAt,
        },
        { status: 410 }
      );
    }

    if (isTicketExpired(expiresAt)) {
      return NextResponse.json(
        {
          error: "This ticket has expired. PDF downloads are no longer available.",
          code: "TICKET_EXPIRED",
          expiresAt,
        },
        { status: 410 }
      );
    }

    // Regenerate on demand so ticket design, event artwork, venue, and terms stay current.
    const qrCodeDataUri = await generateQRCodeDataUri(createTicketQrPayload(ticket.barcode, expiresAt));

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
    let resolvedMetadata = metadata;
    if (metadata.seatingProvider === "seats.io" && typeof metadata.selectedSeatId === "string" && event) {
      try {
        const chartKey = readSeatsIoChartKey(event.settings);
        const eventKey = readSeatsIoEventKey(event.settings) ?? (chartKey ? seatsIoEventKeyFor(event.id, chartKey) : null);
        if (eventKey) {
          const infos = await readSeatsIoObjectInfos(eventKey, [metadata.selectedSeatId]);
          const info = infos[metadata.selectedSeatId] ?? {};
          const nestedCategory = info.category && typeof info.category === "object" ? info.category as Record<string, unknown> : null;
          const categoryKey = info.categoryKey ?? nestedCategory?.key;
          const categoryLabel = info.categoryLabel ?? nestedCategory?.label ?? (typeof categoryKey === "string" ? categoryKey : null);
          const configured = readSeatsIoPricing(event.settings).find((entry) => String(entry.category) === String(categoryKey));
          resolvedMetadata = {
            ...metadata,
            ...(typeof categoryLabel === "string" && categoryLabel.trim() ? { ticketTypeName: categoryLabel.trim() } : {}),
            ...(configured ? { price: configured.price } : {}),
          };
        }
      } catch {
        // Keep the persisted ticket/type fallback when Seats.io lookup is unavailable.
      }
    }
    const seatCategory = resolvedMetadata.seat?.categoryName ?? resolvedMetadata.seat?.category ?? resolvedMetadata.categoryName ?? resolvedMetadata.ticketTypeName;
    const ticketTypeLabel = typeof metadata.ticketTypeName === "string" && metadata.ticketTypeName.trim()
      ? metadata.ticketTypeName.trim()
      : ticketType?.name ?? (typeof seatCategory === "string" ? seatCategory : "General Admission");
    const rawTicketPrice = resolvedMetadata.seat?.price ?? resolvedMetadata.price ?? ticketType?.price;
    const ticketCurrency = typeof resolvedMetadata.currency === "string" && metadata.currency.trim()
      ? resolvedMetadata.currency.trim().toUpperCase()
      : ticketType?.currency ?? "EGP";
    const formattedTicketPrice = rawTicketPrice == null
      ? undefined
      : formatMoney(Number(rawTicketPrice), ticketCurrency);
    const formattedDate = event?.starts_at
      ? format(new Date(event.starts_at), "MMM d, yyyy • h:mm a")
      : undefined;

    const pdfElement = React.createElement(TicketPDFDocument, {
      data: {
        eventName: event?.title ?? "Event",
        ticketType: ticketTypeLabel,
        venue: venue || undefined,
        startDate: formattedDate,
        description: (typeof publicPage.description === "string" && publicPage.description.trim()) || event?.description || undefined,
        terms,
        attendeeName: ticket.attendee_name ?? "Attendee",
        price: formattedTicketPrice,
        orderNumber: order?.order_number ?? ticket.barcode,
        ticketNumber: ticket.barcode,
        qrCodeDataUri,
        design: {
          backgroundImageUrl: ticketDesign.backgroundImageUrl ?? event?.cover_image_url ?? publicPage.coverImage ?? publicPage.heroImage ?? undefined,
          labelColor: ticketDesign.labelColor ?? "#2563EB",
          textColor: ticketDesign.textColor ?? "#111111",
          showVisitorCode: ticketDesign.showVisitorCode,
          visibleFields: ticketDesign.visibleFields,
        },
        visitorCode: event?.visitor_code ?? undefined,
        seat: resolvedMetadata.seat
          ? `${resolvedMetadata.seat.section} · Row ${resolvedMetadata.seat.row} · Seat ${resolvedMetadata.seat.seat}`
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
