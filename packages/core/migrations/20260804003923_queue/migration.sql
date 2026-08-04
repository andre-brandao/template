CREATE TABLE "job" (
	"id" char(30) NOT NULL,
	"time_created" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"time_updated" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"time_deleted" timestamp(3) with time zone,
	"name" text NOT NULL,
	"payload" jsonb DEFAULT '{}' NOT NULL,
	"user_id" char(30),
	"attempts" integer DEFAULT 0 NOT NULL,
	"error" text,
	"time_available" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"time_reserved" timestamp(3) with time zone,
	"time_failed" timestamp(3) with time zone
);
--> statement-breakpoint
CREATE INDEX "job_reserve" ON "job" ("time_failed","time_available");