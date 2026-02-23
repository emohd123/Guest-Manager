import { getDb } from "./index";
import { 
  companies, users, events, ticketTypes, orders, orderItems, 
  guests, tickets, devices, campaigns 
} from "./schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

async function main() {
  console.log("Starting Database Seeding for Events Dashboard...");
  const db = getDb();

  try {
    // 1. Get the first company and user to attach data to
    const companyList = await db.select().from(companies).limit(1);
    const userList = await db.select().from(users).limit(1);

    if (companyList.length === 0 || userList.length === 0) {
      console.log("No companies or users found in the database. Please sign up in the UI first.");
      process.exit(1);
    }

    const company = companyList[0];
    const user = userList[0];
    console.log(`Seeding data for Company: ${company.name}`);

    // 2. Create a Mock Dashboard Event
    const eventSlug = `demo-event-${Date.now()}`;
    const [event] = await db.insert(events).values({
      companyId: company.id,
      title: "Global Tech Summit 2026",
      slug: eventSlug,
      description: "The premier gathering of technical minds, builders, and innovators.",
      shortDescription: "Annual tech conference.",
      eventType: "conference",
      status: "published",
      startsAt: new Date(Date.now() + 86400000 * 30), // 30 days from now
      endsAt: new Date(Date.now() + 86400000 * 32),
      maxCapacity: 1500,
      registrationEnabled: true,
    }).returning();
    console.log(`Created Event: ${event.title}`);

    // 3. Create Ticket Types
    const [vipTicket, gaTicket, studentTicket] = await db.insert(ticketTypes).values([
      {
        companyId: company.id,
        eventId: event.id,
        name: "VIP All-Access Pass",
        description: "Includes backstage access and VIP networking lounge.",
        price: 99900, // $999.00
        currency: "USD",
        quantityTotal: 100,
        status: "active",
      },
      {
        companyId: company.id,
        eventId: event.id,
        name: "General Admission",
        description: "Standard access to all keynote sessions and expo floor.",
        price: 39900,
        currency: "USD",
        quantityTotal: 1000,
        status: "active",
      },
      {
        companyId: company.id,
        eventId: event.id,
        name: "Student Pass",
        description: "Valid student ID required at check-in.",
        price: 9900,
        currency: "USD",
        quantityTotal: 250,
        status: "active",
      }
    ]).returning();
    console.log(`Created Ticket Types: VIP, GA, Student`);

    // 4. Create Mock Orders, Guests, and Tickets
    console.log("Generating Orders & Attendees...");
    const mockNames = [
      ["Alice", "Smith", "alice@example.com"],
      ["Bob", "Johnson", "bob@example.com"],
      ["Charlie", "Brown", "charlie@example.com"],
      ["Diana", "Prince", "diana@company.com"],
      ["Evan", "Wright", "evan@startup.io"],
      ["Fiona", "Gallagher", "fiona@dev.net"],
      ["George", "Lucas", "george@media.org"],
      ["Hannah", "Abbott", "hannah@university.edu"],
    ];

    for (let i = 0; i < mockNames.length; i++) {
        const [first, last, email] = mockNames[i];
        const isVip = i % 3 === 0;
        const ticketType = isVip ? vipTicket : gaTicket;

        // Create Order
        const [order] = await db.insert(orders).values({
            companyId: company.id,
            eventId: event.id,
            orderNumber: `ORD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
            name: `${first} ${last}`,
            email: email,
            status: "completed",
            subtotal: ticketType.price!,
            total: ticketType.price!,
            paymentMethod: "card",
            completedAt: new Date(Date.now() - Math.random() * 10000000000),
        }).returning();

        // Create Order Item
        await db.insert(orderItems).values({
            orderId: order.id,
            ticketTypeId: ticketType.id,
            quantity: 1,
            unitPrice: ticketType.price!,
            total: ticketType.price!,
        });

        // Create Guest
        const [guest] = await db.insert(guests).values({
            companyId: company.id,
            eventId: event.id,
            firstName: first,
            lastName: last,
            email: email,
            status: isVip ? "checked_in" : "confirmed",
            guestType: ticketType.name,
        }).returning();

        // Create Ticket Record
        await db.insert(tickets).values({
            companyId: company.id,
            eventId: event.id,
            ticketTypeId: ticketType.id,
            orderId: order.id,
            guestId: guest.id,
            barcode: `TCK-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
            attendeeName: `${first} ${last}`,
            attendeeEmail: email,
            status: "valid",
            checkedIn: isVip,
            checkedInAt: isVip ? new Date() : null,
        });
    }

    // 5. Create Devices
    console.log("Generating Devices...");
    await db.insert(devices).values([
        {
            companyId: company.id,
            eventId: event.id,
            name: "Main Entrance iPad",
            status: "online",
            battery: 89,
            appVersion: "1.2.4",
            lastSyncAt: new Date(),
        },
        {
            companyId: company.id,
            eventId: event.id,
            name: "VIP Lounge Scanner",
            status: "offline",
            battery: 12,
            appVersion: "1.2.3",
            lastSyncAt: new Date(Date.now() - 3600000),
        },
        {
            companyId: company.id,
            eventId: event.id,
            name: "Registration Desk PC",
            status: "online",
            battery: 100,
            appVersion: "1.2.4",
            lastSyncAt: new Date(),
        }
    ]);

    // 6. Create Campaigns
    console.log("Generating Campaigns...");
    await db.insert(campaigns).values([
        {
            companyId: company.id,
            eventId: event.id,
            createdBy: user.id,
            name: "Early Bird Announcement",
            type: "email",
            status: "sent",
            subject: "Tickets are now live for Tech Summit!",
            sentCount: "4500",
            openedCount: "2103",
            clickedCount: "420",
            sentAt: new Date(Date.now() - 86400000 * 45),
        },
        {
            companyId: company.id,
            eventId: event.id,
            createdBy: user.id,
            name: "Event Reminder - 1 Week Out",
            type: "sms",
            status: "scheduled",
            targetListIds: ["all_attendees"],
            scheduledAt: new Date(Date.now() + 86400000 * 23),
        }
    ]);

    console.log("✅ Database Seeding Complete!");
    console.log(`Explore the dashboard at: /dashboard/events/${event.id}`);

  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    process.exit(0);
  }
}

main();
