import { text, uniqueIndex } from "drizzle-orm/pg-core";
import { central, id, timestamps, ulid } from "../../drizzle/types";

/** A tenant: its rows live in their own Postgres schema, named by `schema`. */
export const WorkspaceTable = central.table(
  "workspace",
  {
    id: id(),
    ...timestamps,
    slug: text().notNull(),
    name: text().notNull(),
    schema: text().notNull(),
    // `pending` until the setup job has migrated the schema and seated the owner.
    status: text().$type<"pending" | "ready">().notNull().default("pending"),
  },
  (table) => [
    uniqueIndex("workspace_slug").on(table.slug),
    uniqueIndex("workspace_schema").on(table.schema),
  ],
);

/** Who can see a workspace, so listing one's workspaces never opens each. Roles live in its `member`. */
export const AccessTable = central.table(
  "access",
  {
    userID: ulid().notNull(),
    workspaceID: ulid().notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("access_user_workspace").on(table.userID, table.workspaceID)],
);
