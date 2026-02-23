import { getDb } from "./index";
import { companies } from "./schema";
import { appRouter } from "../trpc/router";

async function main() {
  console.log("Triggering test checkout to verify Resend ticket dispatch...");
  
  const db = getDb();
  
  const companyList = await db.select().from(companies).limit(1);
  if (companyList.length === 0) {
    console.error("No companies found. Run the app and create an account first.");
    process.exit(1);
  }
  
  const testCompanyId = companyList[0].id;
  
  // Create a trpc caller with our mocked auth context
  const ctx = { 
    db,
    userId: "mock-user", // Not strictly checked here, just needs to exist
    companyId: testCompanyId 
  };
  
  const caller = appRouter.createCaller(ctx);

  try {
    // 1. Fetch an existing event to book tickets for
    const eventsList = await caller.events.list({});
    if (eventsList.events.length === 0) {
      console.error("No events found in db to test with. Run seed script first.");
      process.exit(1);
    }
    
    const targetEvent = eventsList.events[0]!;
    
    // 2. Fetch ticket types for that event
    const ticketsList = await caller.ticketTypes.list({ eventId: targetEvent.id });
    if (ticketsList.length === 0) {
        console.error("No tickets found for event.");
        process.exit(1);
    }
    
    const targetTicket = ticketsList[0]!;

    // 3. Execute the `orders.create` mutation. 
    // This should trigger the new guest + ticket generation, 
    // and fire the Resend email utility we just built.
    const result = await caller.orders.create({
      eventId: targetEvent.id,
      name: "Alex Verification Check",
      email: "alex.verification@example.com", // This is where the mock email will attempt to send
      items: [
        {
          ticketTypeId: targetTicket.id,
          quantity: 2,
          unitPrice: targetTicket.price ?? 0
        }
      ]
    });

    console.log("✅ Order created successfully:", result.orderNumber);
    console.log("Ticket dispatched to: alex.verification@example.com");
    console.log("Please check your Resend dashboard (or terminal logs if mock mode) to verify the email payload.");

  } catch (error) {
    console.error("❌ Test checkout failed:", error);
  }
  
  process.exit(0);
}

main();
