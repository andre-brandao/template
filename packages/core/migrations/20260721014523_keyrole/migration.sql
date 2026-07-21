ALTER TABLE "key" ADD COLUMN "role_id" char(30);--> statement-breakpoint
-- Bind existing keys to their owner's role in the owner's first org — the
-- closest analog to the old behavior, where a key acted as the whole account.
UPDATE "key" k
SET "role_id" = (SELECT m."role_id" FROM "member" m WHERE m."user_id" = k."user_id" ORDER BY m."time_created" LIMIT 1)
WHERE k."role_id" IS NULL;--> statement-breakpoint
-- Keys whose owner has no membership are dead credentials; drop them so the
-- NOT NULL can land. The previous backfill gave every user a personal org, so
-- this only catches rows orphaned by hard-deleted users.
DELETE FROM "key" WHERE "role_id" IS NULL;--> statement-breakpoint
ALTER TABLE "key" ALTER COLUMN "role_id" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "key_role" ON "key" ("role_id");
