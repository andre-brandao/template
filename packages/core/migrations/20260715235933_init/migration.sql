CREATE TABLE "key" (
	"id" char(30) NOT NULL,
	"time_created" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"time_updated" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"time_deleted" timestamp(3) with time zone,
	"user_id" char(30) NOT NULL,
	"type" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"key" varchar(128) NOT NULL,
	"expires_at" timestamp(3) with time zone,
	"time_used" timestamp(3) with time zone
);
--> statement-breakpoint
CREATE TABLE "todo" (
	"id" char(30) NOT NULL,
	"time_created" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"time_updated" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"time_deleted" timestamp(3) with time zone,
	"user_id" char(30) NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"due_date" timestamp(3) with time zone
);
--> statement-breakpoint
CREATE TABLE "provider" (
	"id" char(30) NOT NULL,
	"time_created" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"time_updated" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"time_deleted" timestamp(3) with time zone,
	"user_id" char(30) NOT NULL,
	"provider_id" text NOT NULL,
	"account_id" varchar(255) NOT NULL,
	"password" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" char(30) NOT NULL,
	"time_created" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"time_updated" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"time_deleted" timestamp(3) with time zone,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text
);
--> statement-breakpoint
CREATE UNIQUE INDEX "key_value" ON "key" ("key");--> statement-breakpoint
CREATE INDEX "key_user" ON "key" ("user_id");--> statement-breakpoint
CREATE INDEX "todo_user" ON "todo" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_account" ON "provider" ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "provider_user" ON "provider" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email" ON "user" ("email");