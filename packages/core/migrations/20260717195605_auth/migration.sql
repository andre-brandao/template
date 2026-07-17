ALTER TABLE "provider" ADD COLUMN "access_token" text;--> statement-breakpoint
ALTER TABLE "provider" ADD COLUMN "refresh_token" text;--> statement-breakpoint
ALTER TABLE "provider" ADD COLUMN "token_expires_at" timestamp(3) with time zone;--> statement-breakpoint
ALTER TABLE "provider" DROP COLUMN "password";--> statement-breakpoint
ALTER TABLE "key" DROP COLUMN "type";