CREATE TABLE "invitation" (
	"id" char(30) NOT NULL,
	"time_created" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"time_updated" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"org_id" char(30) NOT NULL,
	"email" text NOT NULL,
	"role_id" char(30) NOT NULL,
	"inviter_id" char(30) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"token" text NOT NULL,
	"time_expires" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" char(30) NOT NULL,
	"time_created" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"time_updated" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"org_id" char(30) NOT NULL,
	"user_id" char(30) NOT NULL,
	"role_id" char(30) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" char(30) NOT NULL,
	"time_created" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"time_updated" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"time_deleted" timestamp(3) with time zone,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role" (
	"id" char(30) NOT NULL,
	"time_created" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"time_updated" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"org_id" char(30) NOT NULL,
	"name" text NOT NULL,
	"permissions" text[] DEFAULT '{}'::text[] NOT NULL,
	"owner" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "invitation_token" ON "invitation" ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "invitation_pending" ON "invitation" ("org_id","email") WHERE "status" = 'pending';--> statement-breakpoint
CREATE UNIQUE INDEX "member_org_user" ON "member" ("org_id","user_id");--> statement-breakpoint
CREATE INDEX "member_user" ON "member" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "role_org_name" ON "role" ("org_id","name");