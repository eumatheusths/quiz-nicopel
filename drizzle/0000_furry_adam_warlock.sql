CREATE TABLE "admin_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" text NOT NULL,
	"detail" text,
	"target_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_code" text NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"age" integer NOT NULL,
	"raffle_consent" boolean DEFAULT false NOT NULL,
	"consent_version" text NOT NULL,
	"result_group" text,
	"result_role" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "participants_event_email_uq" ON "participants" USING btree ("event_code","email") WHERE "participants"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "participants_event_phone_uq" ON "participants" USING btree ("event_code","phone") WHERE "participants"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "participants_event_created_idx" ON "participants" USING btree ("event_code","created_at");--> statement-breakpoint
CREATE INDEX "participants_raffle_idx" ON "participants" USING btree ("event_code","raffle_consent");