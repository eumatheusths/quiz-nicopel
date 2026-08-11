CREATE TABLE "resumes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"age" integer,
	"address" text,
	"interests" text NOT NULL,
	"file_name" text,
	"file_type" text,
	"file_base64" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
