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
  imagePositionX?: number;
  imagePositionY?: number;
  imageScale?: number;
  showVisitorCode?: boolean;
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
  /** Unique event code shown at the bottom of the ticket (when enabled in design settings) */
  visitorCode?: string;
  /** QR code data URI pointing to the app download page, shown next to the visitor code */
  appDownloadQrUri?: string;
  seat?: string;
}

// A4 portrait ticket: a visual upper half and a practical detail/QR lower half.
const W = 595;
const H = 842;
const HERO_H = 404;

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
      backgroundColor: "#ffffff",
      fontFamily: "Helvetica",
      position: "relative",
    },
    bgImage: {
      position: "absolute",
      top: -(HERO_H * (posY / 100) * (imgScale - 1)),
      left: -(W * (posX / 100) * (imgScale - 1)),
      width: W * imgScale,
      height: HERO_H * imgScale,
    },
    overlay: {
      position: "absolute",
      top: 0,
      left: 0,
      width: W,
      height: HERO_H,
      backgroundColor: "rgba(0,0,0,0.15)",
    },
    bottomStrip: {
      position: "absolute",
      top: HERO_H,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "#ffffff",
      padding: "28 32 28 32",
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    fieldsGrid: {
      flex: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 16,
    },
    fieldItem: {
      minWidth: 150,
      maxWidth: 230,
    },
    fieldLabel: {
      fontSize: 7,
      fontFamily: "Helvetica-Bold",
      textTransform: "uppercase",
      letterSpacing: 1.2,
      marginBottom: 2,
      color: accentColor,
    },
    fieldValue: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      color: textColor,
      lineHeight: 1.3,
    },
    qrSection: {
      alignItems: "center",
      gap: 4,
    },
    qrImage: {
      width: 132,
      height: 132,
      backgroundColor: "#fff",
      padding: 2,
    },
    barcodeText: {
      fontSize: 7,
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
            {data.seat && renderField("RESERVED SEAT", data.seat)}
            {visible.venue && renderField("VENUE", data.venue)}
            {visible.attendeeName && renderField("ATTENDEE", data.attendeeName)}
            {visible.price && data.price && renderField("PRICE", data.price)}
            {visible.orderNumber && renderField("ORDER #", data.orderNumber)}
            {/* Visitor Portal Code + App Download QR — side by side */}
            {data.design.showVisitorCode !== false && data.visitorCode ? (
              <View style={[
                styles.fieldItem,
                {
                  borderTopWidth: 1,
                  borderTopColor: accentColor,
                  paddingTop: 4,
                  marginTop: 2,
                  minWidth: 160,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }
              ]}>
                {/* Left: code text */}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: accentColor, letterSpacing: 1.5 }]}>
                    VISITOR CODE
                  </Text>
                  <Text style={[styles.fieldValue, { fontSize: 11, letterSpacing: 3, color: accentColor, fontFamily: "Helvetica-Bold" }]}>
                    {data.visitorCode}
                  </Text>
                  <Text style={{ fontSize: 5, color: "#6b7280", marginTop: 1 }}>
                    Use in Visitor Portal app
                  </Text>
                </View>
                {/* Right: app download QR */}
                {data.appDownloadQrUri ? (
                  <View style={{ alignItems: "center", gap: 2 }}>
                    <Image src={data.appDownloadQrUri} style={{ width: 36, height: 36, backgroundColor: "#fff" }} />
                    <Text style={{ fontSize: 4.5, color: "#6b7280", textAlign: "center" }}>Download App</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
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
