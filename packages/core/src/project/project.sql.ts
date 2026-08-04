import { index, pgTable as table, text } from "drizzle-orm/pg-core";
import { id, timestamps, ulid } from "../drizzle/types";

export const ProjectTable = table(
  "project",
  {
    id: id(),
    ...timestamps,
    createdBy: ulid("created_by").notNull(),
    name: text("name").notNull(),
    description: text(),
  },
  (table) => [index("project_created_by").on(table.createdBy)],
);
