import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Button,
  Row,
  Column,
} from "@react-email/components";
import * as React from "react";

interface TicketEmailProps {
  // Event info
  eventName?: string;
  attendeeName?: string;
  ticketName?: string;
  orderNumber?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  qrCodeDataUri?: string;
  ticketUrl?: string;
  confirmAttendanceUrl?: string;
  // Design settings (from event.settings)
  headerImageUrl?: string;
  labelColor?: string;
  senderName?: string;
  customBodyHtml?: string;
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

const DEFAULT_BODY = `Kindly read the instructions carefully:

• Please present the invitation ticket to the check-in point at the venue to avoid any delay, as the tickets are valid for one-time use only.
• Kindly follow the instructions by the ushers during the ceremony.`;

export const TicketEmail = ({
  eventName = "Event",
  attendeeName = "Attendee",
  ticketName = "General Admission",
  orderNumber = "000000",
  eventDate = "TBD",
  eventTime = "TBD",
  eventLocation = "TBD",
  qrCodeDataUri = "",
  ticketUrl = "#",
  confirmAttendanceUrl,
  headerImageUrl = "",
  labelColor = "#2563EB",
  senderName = "Guest Manager",
  customBodyHtml = DEFAULT_BODY,
  visibleFields = {
    eventName: true,
    ticketType: true,
    venue: true,
    startDate: true,
    attendeeName: true,
    barcode: true,
    orderNumber: false,
  },
}: TicketEmailProps) => {
  const accent = labelColor;

  return (
    <Html>
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
          * { font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        `}</style>
      </Head>
      <Preview>Your ticket for {eventName} — {attendeeName}</Preview>
      <Body style={main}>
        <Container style={container}>

          {/* Header image */}
          {headerImageUrl && (
            <Img
              src={headerImageUrl}
              width="600"
              height="200"
              alt={eventName}
              style={{ width: "100%", height: "auto", display: "block", borderRadius: "12px 12px 0 0" }}
            />
          )}

          {/* Greeting */}
          <Section style={{ padding: "32px 40px 0" }}>
            <Text style={{ fontSize: "22px", fontWeight: "900", color: "#111", marginBottom: "4px" }}>
              Here is your ticket! 🎟️
            </Text>
            <Text style={{ fontSize: "15px", color: "#555", marginTop: "0", lineHeight: "24px" }}>
              Hi {attendeeName}, thank you for registering for <strong>{eventName}</strong>.
              Please find your ticket details below.
            </Text>
          </Section>

          {/* Custom body */}
          {customBodyHtml && (
            <Section style={{ padding: "0 40px" }}>
              <div
                style={{ fontSize: "14px", color: "#444", lineHeight: "24px", whiteSpace: "pre-wrap" }}
                dangerouslySetInnerHTML={{ __html: customBodyHtml.replace(/\n/g, "<br/>") }}
              />
            </Section>
          )}

          <Hr style={{ borderColor: "#e5e7eb", margin: "24px 40px" }} />

          {/* Ticket card */}
          <Section style={{ padding: "0 24px 24px" }}>
            <div style={ticketCard}>
              {/* Left side: Fields */}
              <Row>
                <Column style={{ verticalAlign: "top", paddingRight: "24px" }}>
                  {/* 3-column grid of fields */}
                  <Row>
                    {visibleFields.eventName && (
                      <Column style={fieldCol}>
                        <Text style={{ ...fieldLabel, color: accent }}>EVENT</Text>
                        <Text style={fieldValue}>{eventName}</Text>
                      </Column>
                    )}
                    {visibleFields.startDate && (
                      <Column style={fieldCol}>
                        <Text style={{ ...fieldLabel, color: accent }}>DATE</Text>
                        <Text style={fieldValue}>{eventDate}</Text>
                      </Column>
                    )}
                    {visibleFields.ticketType && (
                      <Column style={fieldCol}>
                        <Text style={{ ...fieldLabel, color: accent }}>TICKET TYPE</Text>
                        <Text style={fieldValue}>{ticketName}</Text>
                      </Column>
                    )}
                  </Row>
                  <Row style={{ marginTop: "16px" }}>
                    {visibleFields.venue && (
                      <Column style={fieldCol}>
                        <Text style={{ ...fieldLabel, color: accent }}>VENUE</Text>
                        <Text style={fieldValue}>{eventLocation}</Text>
                      </Column>
                    )}
                    {visibleFields.attendeeName && (
                      <Column style={fieldCol}>
                        <Text style={{ ...fieldLabel, color: accent }}>ATTENDEE</Text>
                        <Text style={fieldValue}>{attendeeName}</Text>
                      </Column>
                    )}
                    {visibleFields.orderNumber && (
                      <Column style={fieldCol}>
                        <Text style={{ ...fieldLabel, color: accent }}>ORDER</Text>
                        <Text style={fieldValue}>#{orderNumber}</Text>
                      </Column>
                    )}
                  </Row>
                </Column>

                {/* QR Code */}
                {visibleFields.barcode && qrCodeDataUri && (
                  <Column style={{ verticalAlign: "top", textAlign: "center" as const, width: "110px" }}>
                    <Img
                      src={qrCodeDataUri}
                      width="100"
                      height="100"
                      alt="Ticket QR Code"
                      style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "4px", backgroundColor: "#fff" }}
                    />
                    <Text style={{ fontSize: "8px", fontFamily: "monospace", color: "#9ca3af", marginTop: "4px" }}>
                      {orderNumber}
                    </Text>
                  </Column>
                )}
              </Row>
            </div>
          </Section>

          {/* CTA Buttons */}
          <Section style={{ padding: "0 40px 32px", textAlign: "center" as const }}>
            <Button
              href={ticketUrl}
              style={{
                backgroundColor: accent,
                color: "#fff",
                borderRadius: "10px",
                padding: "14px 28px",
                fontWeight: "700",
                fontSize: "14px",
                textDecoration: "none",
                display: "inline-block",
                marginRight: "12px",
              }}
            >
              View Ticket
            </Button>
            {confirmAttendanceUrl ? (
              <Button
                href={confirmAttendanceUrl}
                style={{
                  backgroundColor: "#111827",
                  color: "#fff",
                  borderRadius: "10px",
                  padding: "14px 28px",
                  fontWeight: "700",
                  fontSize: "14px",
                  textDecoration: "none",
                  display: "inline-block",
                  marginTop: "12px",
                }}
              >
                Confirm Attendance
              </Button>
            ) : null}
          </Section>

          {/* Footer */}
          <Hr style={{ borderColor: "#e5e7eb", margin: "0 40px" }} />
          <Section style={{ padding: "20px 40px" }}>
            <Text style={{ fontSize: "12px", color: "#9ca3af", textAlign: "center" as const, lineHeight: "20px" }}>
              This email was sent by {senderName}. If you have questions, please reply to this email.
              <br />Tickets are for one-time use only.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  borderRadius: "16px",
  boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  maxWidth: "600px",
  overflow: "hidden" as const,
};

const ticketCard = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "24px",
};

const fieldCol = {
  paddingRight: "16px",
  minWidth: "120px",
};

const fieldLabel = {
  fontSize: "8px",
  fontWeight: "900" as const,
  letterSpacing: "0.15em",
  textTransform: "uppercase" as const,
  margin: "0 0 2px",
};

const fieldValue = {
  fontSize: "12px",
  fontWeight: "700" as const,
  color: "#1e293b",
  fontFamily: "monospace",
  margin: "0",
  lineHeight: "1.4",
};

export default TicketEmail;
