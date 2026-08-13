CREATE TABLE "webhook" (
	"id" char(30) NOT NULL,
	"time_created" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"time_updated" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"time_deleted" timestamp(3) with time zone,
	"created_by" char(30) NOT NULL,
	"url" text NOT NULL,
	"secret" text NOT NULL,
	"types" text[] DEFAULT '{}'::text[] NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"failures" integer DEFAULT 0 NOT NULL,
	"last_status" integer,
	"time_delivered" timestamp(3) with time zone
);
--> statement-breakpoint
CREATE INDEX "webhook_enabled" ON "webhook" ("enabled");