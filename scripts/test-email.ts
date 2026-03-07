import { getDb } from "../src/server/db";
import { guests, tickets, events, ticketTypes } from "../src/server/db/schema";
import { eq } from "drizzle-orm";
import { sendTicketEmail } from "../src/server/actions/email";
import { format } from "date-fns";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function run() {
  const db = getDb();
  
  console.log("Fetching a guest with an email...");
  const guestList = await db.select().from(guests).limit(10);
  const guest = guestList.find(g => g.email && g.email.includes("@"));

  if (!guest) {
    console.log("No valid guest with an email found in DB. Please add one first.");
    process.exit(1);
  }

  console.log(`Found guest: ${guest.firstName} ${guest.lastName} (${guest.email})`);
  
  const [ticket] = await db.select().from(tickets).where(eq(tickets.guestId, guest.id)).limit(1);
  
  if (!ticket) {
    console.log("Guest has no ticket. Cannot send ticket email.");
    process.exit(1);
  }

  const [event] = await db.select().from(events).where(eq(events.id, guest.eventId)).limit(1);
  const [ticketType] = await db.select().from(ticketTypes).where(eq(ticketTypes.id, ticket.ticketTypeId)).limit(1);

  console.log(`Ticket barcode: ${ticket.barcode}, Event: ${event?.title}`);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const ticketUrl = `${baseUrl}/api/tickets/${ticket.id}/pdf`;
  
  const eventDate = event?.startsAt ? format(new Date(event.startsAt), "MMM d, yyyy") : undefined;
  const eventTime = event?.startsAt ? format(new Date(event.startsAt), "h:mm a") : undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const settings = (event?.settings as any) || {};

  console.log("Sending email...");
  try {
    const testRecipient = process.env.TEST_EMAIL_TO || guest.email || "";
    if (!testRecipient) {
      console.log("No recipient email available. Set TEST_EMAIL_TO in .env.local or use a guest with an email.");
      process.exit(1);
    }

    const result = await sendTicketEmail({
      toEmail: testRecipient,
      eventName: event?.title || "Event",
      attendeeName: `${guest.firstName} ${guest.lastName || ""}`.trim(),
      ticketName: ticketType?.name || "General Admission",
      orderNumber: ticket.barcode,
      barcode: ticket.barcode,
      eventDate,
      eventTime,
      eventLocation: undefined,
      ticketUrl,
      emailDesign: settings.emailDesign,
      ticketDesign: settings.ticketDesign,
    });

    console.log("Email send result:", result);
  } catch (error) {
    console.error("Failed to send email:", error);
  }
  
  process.exit(0);
}

run();
