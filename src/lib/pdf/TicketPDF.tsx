// TicketPDF.tsx
// Server-only: generates a PDF ticket using @react-pdf/renderer
// This file must only be used in server contexts (API routes, server actions)

import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

export interface TicketPDFDesign {
  backgroundImageUrl?: string;
  labelColor?: string;
  textColor?: string;
  imagePositionX?: number; // 0–100
  imagePositionY?: number;
  imageScale?: number;
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

export interface TicketPDFData {
  eventName: string;
  ticketType: string;
  venue?: string;
  startDate?: string;
  attendeeName: string;
  price?: string;
  orderNumber: string;
  qrCodeDataUri: string;
  design: TicketPDFDesign;
}

// Ticket is landscape credit-card size: 3.375" × 2.125" → 243 × 153 pt
const W = 595; // Use A4 width for compatibility
const H = 374; // ~half A4 height, landscape feel

export function TicketPDFDocument({ data }: { data: TicketPDFData }) {
  const accentColor = data.design.labelColor ?? "#2563EB";
  const textColor = data.design.textColor ?? "#111111";
  const posX = data.design.imagePositionX ?? 50;
  const posY = data.design.imagePositionY ?? 50;
  const imgScale = data.design.imageScale ?? 1;
  const visible = data.design.visibleFields ?? {
    eventName: true,
    ticketType: true,
    venue: true,
    startDate: true,
    attendeeName: true,
    barcode: true,
  };

  const styles = StyleSheet.create({
    page: {
      width: W,
      height: H,
      backgroundColor: "#1a2340",
      fontFamily: "Helvetica",
      position: "relative",
    },
    bgImage: {
      position: "absolute",
      top: -(H * (posY / 100) * (imgScale - 1)),
      left: -(W * (posX / 100) * (imgScale - 1)),
      width: W * imgScale,
      height: H * imgScale,
    },
    overlay: {
      position: "absolute",
      top: 0,
      left: 0,
      width: W,
      height: H,
      backgroundColor: "rgba(0,0,0,0.15)",
    },
    bottomStrip: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "rgba(255,255,255,0.97)",
      padding: "12 16 12 16",
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    fieldsGrid: {
      flex: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    fieldItem: {
      minWidth: 100,
      maxWidth: 160,
    },
    fieldLabel: {
      fontSize: 6,
      fontFamily: "Helvetica-Bold",
      textTransform: "uppercase",
      letterSpacing: 1.2,
      marginBottom: 2,
      color: accentColor,
    },
    fieldValue: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: textColor,
      lineHeight: 1.3,
    },
    qrSection: {
      alignItems: "center",
      gap: 4,
    },
    qrImage: {
      width: 72,
      height: 72,
      backgroundColor: "#fff",
      padding: 2,
    },
    barcodeText: {
      fontSize: 5,
      fontFamily: "Helvetica",
      color: "#9ca3af",
      textAlign: "center",
    },
  });

  const renderField = (label: string, value: string | undefined) => {
    if (!value) return null;
    return (
      <View style={styles.fieldItem}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value}</Text>
      </View>
    );
  };

  return (
    <Document>
      <Page size={[W, H]} style={styles.page}>
        {/* Background image */}
        {data.design.backgroundImageUrl ? (
          <Image src={data.design.backgroundImageUrl} style={styles.bgImage} />
        ) : null}

        {/* Subtle overlay */}
        <View style={styles.overlay} />

        {/* Bottom info strip */}
        <View style={styles.bottomStrip}>
          <View style={styles.fieldsGrid}>
            {visible.eventName && renderField("EVENT", data.eventName)}
            {visible.startDate && renderField("DATE", data.startDate)}
            {visible.ticketType && renderField("TICKET TYPE", data.ticketType)}
            {visible.venue && renderField("VENUE", data.venue)}
            {visible.attendeeName && renderField("ATTENDEE", data.attendeeName)}
            {visible.price && data.price && renderField("PRICE", data.price)}
            {visible.orderNumber && renderField("ORDER #", data.orderNumber)}
          </View>

          {/* QR Code */}
          {visible.barcode && (
            <View style={styles.qrSection}>
              <Image src={data.qrCodeDataUri} style={styles.qrImage} />
              <Text style={styles.barcodeText}>{data.orderNumber}</Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}
