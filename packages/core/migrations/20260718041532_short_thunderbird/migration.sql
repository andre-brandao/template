CREATE TABLE "event" (
	"id" char(30) NOT NULL,
	"time_created" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"time_updated" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"time_deleted" timestamp(3) with time zone,
	"user_id" char(30),
	"type" text NOT NULL,
	"source" text,
	"source_id" char(30),
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"data" jsonb DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE INDEX "event_user" ON "event" ("user_id");--> statement-breakpoint
CREATE INDEX "event_source" ON "event" ("source","source_id");--> statement-breakpoint
CREATE INDEX "event_type" ON "event" ("type");--> statement-breakpoint
CREATE INDEX "event_tags" ON "event" USING gin ("tags");