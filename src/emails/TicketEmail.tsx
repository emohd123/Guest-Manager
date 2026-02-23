import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface TicketEmailProps {
  eventName?: string;
  attendeeName?: string;
  ticketName?: string;
  orderNumber?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  qrCodeDataUri?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";

export const TicketEmail = ({
  eventName = "Global Tech Summit 2026",
  attendeeName = "John Doe",
  ticketName = "VIP All-Access Pass",
  orderNumber = "ORD-ABC-123",
  eventDate = "Sept 12, 2026",
  eventTime = "9:00 AM - 6:00 PM PST",
  eventLocation = "Moscone Center, San Francisco",
  qrCodeDataUri = "",
}: TicketEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your Digital Ticket for {eventName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Here is your ticket!</Heading>
          <Text style={paragraph}>
            Hi {attendeeName},
          </Text>
          <Text style={paragraph}>
            Thank you for registering for <strong>{eventName}</strong>. Below is your digital ticket. Please present the QR code at the entrance for quick check-in.
          </Text>
          
          <Section style={ticketCard}>
            <Text style={eventNameStyle}>{eventName}</Text>
            <Text style={eventDetailsStyle}>
              📅 {eventDate}
            </Text>
            <Text style={eventDetailsStyle}>
              ⏰ {eventTime}
            </Text>
            <Text style={eventDetailsStyle}>
              📍 {eventLocation}
            </Text>

            <Hr style={hr} />
            
            <Text style={ticketTypeStyle}>🎟️ {ticketName}</Text>
            <Text style={attendeeNameStyle}>{attendeeName}</Text>
            <Text style={orderNumberStyle}>Order #{orderNumber}</Text>

            {qrCodeDataUri ? (
              <Section style={qrCodeSection}>
                <Img
                  src={qrCodeDataUri}
                  width="200"
                  height="200"
                  alt="Ticket QR Code"
                  style={qrCodeImage}
                />
              </Section>
            ) : (
              <Section style={qrCodeSection}>
                <div style={qrCodePlaceholder}>QR Code Here</div>
              </Section>
            )}
          </Section>

          <Text style={footer}>
            If you have any questions, please reply to this email. See you at the event!
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  marginBottom: "64px",
  borderRadius: "8px",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
  maxWidth: "600px",
};

const heading = {
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "30px 0",
  color: "#333",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#555",
};

const ticketCard = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "24px",
  marginTop: "24px",
  marginBottom: "24px",
  textAlign: "center" as const,
};

const eventNameStyle = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#111",
  marginBottom: "16px",
};

const eventDetailsStyle = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "4px 0",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const ticketTypeStyle = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#3b82f6", // Blue
  margin: "8px 0",
};

const attendeeNameStyle = {
  fontSize: "16px",
  fontWeight: "500",
  color: "#111",
  margin: "4px 0",
};

const orderNumberStyle = {
  fontSize: "12px",
  color: "#9ca3af",
  margin: "4px 0",
};

const qrCodeSection = {
  marginTop: "24px",
  display: "inline-block",
  padding: "16px",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  border: "1px dashed #d1d5db",
};

const qrCodeImage = {
  display: "block",
  margin: "0 auto",
};

const qrCodePlaceholder = {
  width: "200px",
  height: "200px",
  backgroundColor: "#e5e7eb",
  lineHeight: "200px",
  color: "#6b7280",
  borderRadius: "4px",
};

const footer = {
  fontSize: "14px",
  color: "#8898aa",
  textAlign: "center" as const,
  marginTop: "32px",
};

export default TicketEmail;
