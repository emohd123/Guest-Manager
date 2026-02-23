import { pgTable, uuid, jsonb, timestamp } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { events } from "./events";
import { contacts } from "./contacts";

export const formResponses = pgTable("form_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id").references(() => contacts.id),
  responseData: jsonb("response_data").default({}).notNull(),
  metadata: jsonb("metadata").default({}),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});
