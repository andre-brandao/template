import { boolean, pgTable as table, text, uniqueIndex } from "drizzle-orm/pg-core";
import { id, timestamp, ulid } from "../drizzle/types";

// Hard-deleted (no time_deleted): removal is blocked while any member or
// pending invitation references the role, so a live row is always resolvable.
export const RoleTable = table(
  "role",
  {
    id: id(),
    timeCreated: timestamp("time_created").notNull().defaultNow(),
    timeUpdated: timestamp("time_updated").notNull().defaultNow(),
    orgID: ulid("org_id").notNull(),
    name: text("name").notNull(),
    permissions: text().array().notNull().default([]),
    owner: boolean("owner").notNull().default(false),
  },
  (table) => [uniqueIndex("role_org_name").on(table.orgID, table.name)],
);
