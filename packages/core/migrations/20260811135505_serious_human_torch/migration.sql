CREATE TABLE "project" (
	"id" char(30) NOT NULL,
	"time_created" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"time_updated" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"time_deleted" timestamp(3) with time zone,
	"created_by" char(30) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"image" text
);
--> statement-breakpoint
DROP INDEX "todo_user";--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN "created_by" char(30) NOT NULL;--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN "assignee" char(30);--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN "source" text;--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN "source_id" char(30);--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN "stage" text;--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN "status" text DEFAULT 'backlog' NOT NULL;--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN "reason" text;--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN "start_date" timestamp(3) with time zone;--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN "time_started" timestamp(3) with time zone;--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN "time_done" timestamp(3) with time zone;--> statement-breakpoint
ALTER TABLE "todo" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "todo" DROP COLUMN "state";--> statement-breakpoint
ALTER TABLE "todo" DROP COLUMN "state_reason";--> statement-breakpoint
CREATE INDEX "project_created_by" ON "project" ("created_by");--> statement-breakpoint
CREATE INDEX "todo_source" ON "todo" ("source","source_id","status");--> statement-breakpoint
CREATE INDEX "todo_assignee" ON "todo" ("assignee","status");--> statement-breakpoint
CREATE INDEX "todo_stage" ON "todo" ("source","source_id","stage");