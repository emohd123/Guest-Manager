import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { getDb } from "../src/server/db";
import { events } from "../src/server/db/schema/events";
import { sentEmails } from "../src/server/db/schema/sent-emails";
import { nanoid } from "nanoid";

async function seed() {
  const db = getDb();
  
  const eventList = await db.select().from(events).limit(1);
  if (!eventList.length) {
    console.log("No events found to seed emails for.");
    process.exit(1);
  }

  const eventId = eventList[0].id;
  console.log(`Seeding emails for event: ${eventId}`);

  const mockData = [
    {
      eventId,
      type: "Ticket sent",
      state: "Delivered",
      status: "Opened",
      emailAddress: "20192110416@student.asu.edu.bh",
      subject: "Graduation Ceremony - Evening",
      openCount: 5,
      clickCount: 0,
      reason: "",
    },
    {
      eventId,
      type: "Ticket voided",
      state: "Delivered",
      status: "Opened",
      emailAddress: "rawanalawa77@gmail.com",
      subject: "Ticket Canceled",
      openCount: 9,
      clickCount: 0,
      reason: "",
    },
    {
      eventId,
      type: "Ticket sent",
      state: "Delivered",
      status: "Unopened",
      emailAddress: "shosho92226@hotmail.com",
      subject: "Graduation Ceremony - Evening",
      openCount: 0,
      clickCount: 0,
      reason: "",
    },
    {
      eventId,
      type: "Ticket sent",
      state: "Delivered",
      status: "Opened",
      emailAddress: "alboqaishi.s@gmail.com",
      subject: "Graduation Ceremony - Evening",
      openCount: 10,
      clickCount: 0,
      reason: "",
    },
    {
      eventId,
      type: "Ticket sent",
      state: "Delivered",
      status: "Opened",
      emailAddress: "marwa.al3oadhi@gmail.com",
      subject: "Graduation Ceremony - Evening",
      openCount: 7,
      clickCount: 0,
      reason: "",
    },
    {
      eventId,
      type: "Ticket sent",
      state: "Delivered",
      status: "Unopened",
      emailAddress: "marwa.al3oadhi@gmail.com",
      subject: "Graduation Ceremony - Evening",
      openCount: 0,
      clickCount: 0,
      reason: "",
    },
    {
      eventId,
      type: "Ticket sent",
      state: "Delivered",
      status: "Opened",
      emailAddress: "fatima.balal86@gmail.com",
      subject: "Graduation Ceremony - Evening",
      openCount: 1,
      clickCount: 0,
      reason: "",
    },
    {
      eventId,
      type: "Ticket sent",
      state: "Delivered",
      status: "Opened",
      emailAddress: "fatima.balal86@gmail.com",
      subject: "Graduation Ceremony - Evening",
      openCount: 6,
      clickCount: 1,
      reason: "",
    },
    {
      eventId,
      type: "Ticket voided",
      state: "Delivered",
      status: "Opened",
      emailAddress: "rawanalawa77@gmail.com",
      subject: "Ticket Canceled",
      openCount: 8,
      clickCount: 0,
      reason: "",
    },
    {
      eventId,
      type: "Ticket sent",
      state: "Delivered",
      status: "Unopened",
      emailAddress: "hajerameer7@gmail.com",
      subject: "Graduation Ceremony - Evening",
      openCount: 0,
      clickCount: 0,
      reason: "",
    }
  ];

  await db.insert(sentEmails).values(mockData.map(d => ({...d, id: nanoid()})));

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch(console.error);
