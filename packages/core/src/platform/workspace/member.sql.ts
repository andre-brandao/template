import { snakeCase, text } from "drizzle-orm/pg-core";
import { timestamps, ulid } from "../../drizzle/types";
import type { Workspace } from "../../workspace";

/** A workspace's people and their roles; tenant tables join this, not `central.user`. */
export const MemberTable = snakeCase.table("member", {
  userID: ulid().primaryKey(),
  role: text().$type<Workspace.Role>().notNull().default("member"),
  name: text().notNull(),
  email: text().notNull(),
  ...timestamps,
});
