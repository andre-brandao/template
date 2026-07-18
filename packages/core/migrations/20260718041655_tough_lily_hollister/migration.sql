ALTER TABLE "todo" ADD COLUMN "body" text;--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN "state" text DEFAULT 'open' NOT NULL;--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN "state_reason" text;--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN "tags" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
UPDATE "todo" SET "state" = 'closed', "state_reason" = 'completed' WHERE "status" = 'done';--> statement-breakpoint
DROP INDEX "todo_user";--> statement-breakpoint
CREATE INDEX "todo_user" ON "todo" ("user_id","state");