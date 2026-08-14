CREATE TABLE "resume_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"upload_id" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"chunk_base64" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
