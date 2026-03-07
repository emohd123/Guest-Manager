import { pgTable, uuid, varchar, text, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { events } from "./events";
import { users } from "./users";

export const campaignTypeEnum = pgEnum("campaign_type", ["email", "sms"]);
export const campaignStatusEnum = pgEnum("campaign_status", ["draft", "scheduled", "sending", "sent", "failed"]);

export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }),
  createdBy: uuid("created_by").references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  type: campaignTypeEnum("campaign_type").default("email").notNull(),
  status: campaignStatusEnum("campaign_status").default("draft").notNull(),
  subject: varchar("subject", { length: 255 }),
  content: text("content"),
  targetListIds: jsonb("target_list_ids").default([]),
  sentCount: text("sent_count").default("0"),
  openedCount: text("opened_count").default("0"),
  clickedCount: text("clicked_count").default("0"),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
