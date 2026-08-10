CREATE TABLE "admin_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" text NOT NULL,
	"detail" text,
	"target_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raffle_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_code" text NOT NULL,
	"full_name" text NOT NULL,
	"email" text,
	"phone" text,
	"course" text,
	"institution" text,
	"result_group" text NOT NULL,
	"result_role" text NOT NULL,
	"raffle_consent" boolean NOT NULL,
	"opportunities_consent" boolean DEFAULT false NOT NULL,
	"consent_version" text NOT NULL,
	"consented_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "raffle_entries_event_email_uq" ON "raffle_entries" USING btree ("event_code","email") WHERE "raffle_entries"."email" is not null and "raffle_entries"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "raffle_entries_event_phone_uq" ON "raffle_entries" USING btree ("event_code","phone") WHERE "raffle_entries"."phone" is not null and "raffle_entries"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "raffle_entries_event_created_idx" ON "raffle_entries" USING btree ("event_code","created_at");--> statement-breakpoint
CREATE INDEX "raffle_entries_result_idx" ON "raffle_entries" USING btree ("event_code","result_role");