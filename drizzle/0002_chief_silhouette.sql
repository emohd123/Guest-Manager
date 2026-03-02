CREATE TABLE "sent_emails" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text,
	"type" text DEFAULT 'Ticket sent' NOT NULL,
	"state" text DEFAULT 'Delivered' NOT NULL,
	"status" text DEFAULT 'Unopened' NOT NULL,
	"email_address" text NOT NULL,
	"subject" text NOT NULL,
	"open_count" integer DEFAULT 0 NOT NULL,
	"click_count" integer DEFAULT 0 NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sent_emails" ADD CONSTRAINT "sent_emails_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;