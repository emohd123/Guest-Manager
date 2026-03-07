DO $$ BEGIN
 CREATE TYPE "public"."attendance_state" AS ENUM('not_arrived', 'checked_in', 'checked_out');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."scan_method" AS ENUM('scan', 'search', 'manual', 'walkup');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."paired_via" AS ENUM('code_pin', 'qr', 'staff');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."device_command_status" AS ENUM('pending', 'ack', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."device_command_type" AS ENUM('ping');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "installation_id" text;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "platform" varchar(20);--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "model" varchar(100);--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "os_version" varchar(50);--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "paired_via" "paired_via";--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "station" varchar(120);--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "last_report_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "scanner_battery" integer;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "scanner_charge_state" varchar(40);--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "onsite_pin" varchar(10);--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "event_device_access" (
	"event_id" uuid PRIMARY KEY NOT NULL,
	"access_code" varchar(6) NOT NULL,
	"pin_hash" text NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"last_rotated_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_device_access_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "event_device_access_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "device_pair_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "device_pair_tokens_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "device_pair_tokens_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "device_pair_tokens_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "device_pair_tokens_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "device_commands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"device_id" text NOT NULL,
	"command_type" "device_command_type" DEFAULT 'ping' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "device_command_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ack_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "device_commands_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "device_commands_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "device_commands_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE cascade ON UPDATE no action
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "mobile_mutation_dedup" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" text NOT NULL,
	"event_id" uuid NOT NULL,
	"client_mutation_id" varchar(120) NOT NULL,
	"response_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mobile_mutation_dedup_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "mobile_mutation_dedup_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action
);--> statement-breakpoint

ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "seat_number" varchar(50);--> statement-breakpoint
ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "checked_in_at" timestamp;--> statement-breakpoint
ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "checked_out_at" timestamp;--> statement-breakpoint
ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "attendance_state" "attendance_state";--> statement-breakpoint
UPDATE "guests" SET "attendance_state" = 'not_arrived' WHERE "attendance_state" IS NULL;--> statement-breakpoint
ALTER TABLE "guests" ALTER COLUMN "attendance_state" SET DEFAULT 'not_arrived';--> statement-breakpoint
ALTER TABLE "guests" ALTER COLUMN "attendance_state" SET NOT NULL;--> statement-breakpoint

ALTER TABLE "scans" ADD COLUMN IF NOT EXISTS "device_id" text;--> statement-breakpoint
ALTER TABLE "scans" ADD COLUMN IF NOT EXISTS "method" "scan_method";--> statement-breakpoint
UPDATE "scans" SET "method" = 'scan' WHERE "method" IS NULL;--> statement-breakpoint
ALTER TABLE "scans" ALTER COLUMN "method" SET DEFAULT 'scan';--> statement-breakpoint
ALTER TABLE "scans" ALTER COLUMN "method" SET NOT NULL;--> statement-breakpoint

DO $$ BEGIN
 IF NOT EXISTS (
   SELECT 1 FROM pg_constraint WHERE conname = 'scans_device_id_devices_id_fk'
 ) THEN
   ALTER TABLE "scans" ADD CONSTRAINT "scans_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE set null ON UPDATE no action;
 END IF;
END $$;--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "event_device_access_access_code_idx" ON "event_device_access" USING btree ("access_code");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "mobile_mutation_dedup_device_mutation_idx" ON "mobile_mutation_dedup" USING btree ("device_id","client_mutation_id");

