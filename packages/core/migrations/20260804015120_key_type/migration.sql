ALTER TABLE "key" ADD COLUMN "type" text DEFAULT 'api' NOT NULL;--> statement-breakpoint
ALTER TABLE "key" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
CREATE INDEX "key_type" ON "key" ("type");