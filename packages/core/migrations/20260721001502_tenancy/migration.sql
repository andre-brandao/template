DROP INDEX "file_user";--> statement-breakpoint
DROP INDEX "todo_user";--> statement-breakpoint
ALTER TABLE "file" ADD COLUMN "org_id" char(30);--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN "org_id" char(30);--> statement-breakpoint
-- Backfill: a personal org (owner role + membership) for every user without one.
-- Ids are derived from the user's ulid suffix, so the backfill is deterministic
-- and idempotent: usr_XXXX -> org_XXXX / rol_XXXX / mbr_XXXX.
INSERT INTO "organization" ("id", "name")
SELECT 'org_' || substr(u."id", 5), u."name" || '''s Org'
FROM "user" u
WHERE NOT EXISTS (SELECT 1 FROM "member" m WHERE m."user_id" = u."id");--> statement-breakpoint
INSERT INTO "role" ("id", "org_id", "name", "permissions", "owner")
SELECT 'rol_' || substr(u."id", 5), 'org_' || substr(u."id", 5), 'Owner', '{*}', true
FROM "user" u
WHERE NOT EXISTS (SELECT 1 FROM "member" m WHERE m."user_id" = u."id");--> statement-breakpoint
INSERT INTO "member" ("id", "org_id", "user_id", "role_id")
SELECT 'mbr_' || substr(u."id", 5), 'org_' || substr(u."id", 5), u."id", 'rol_' || substr(u."id", 5)
FROM "user" u
WHERE NOT EXISTS (SELECT 1 FROM "member" m WHERE m."user_id" = u."id");--> statement-breakpoint
-- Point existing rows at their creator's first org.
UPDATE "todo" t
SET "org_id" = (SELECT m."org_id" FROM "member" m WHERE m."user_id" = t."user_id" ORDER BY m."time_created" LIMIT 1)
WHERE t."org_id" IS NULL;--> statement-breakpoint
UPDATE "file" f
SET "org_id" = (SELECT m."org_id" FROM "member" m WHERE m."user_id" = f."user_id" ORDER BY m."time_created" LIMIT 1)
WHERE f."org_id" IS NULL;--> statement-breakpoint
ALTER TABLE "file" ALTER COLUMN "org_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "todo" ALTER COLUMN "org_id" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "file_org" ON "file" ("org_id");--> statement-breakpoint
CREATE INDEX "todo_org" ON "todo" ("org_id","state");
