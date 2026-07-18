CREATE TABLE "file" (
	"id" char(30) NOT NULL,
	"time_created" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"user_id" char(30) NOT NULL,
	"filename" text NOT NULL,
	"content_type" text NOT NULL,
	"size" integer NOT NULL,
	"key" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "file_user" ON "file" ("user_id");