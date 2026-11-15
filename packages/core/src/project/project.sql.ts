import { index, jsonb, snakeCase, text } from "drizzle-orm/pg-core";
import type { Metadata } from "../util/meta";
import { id, timestamps, ulid } from "../drizzle/types";

export const ProjectTable = snakeCase.table(
  "project",
  {
    id: id(),
    ...timestamps,
    createdBy: ulid().notNull(),
    name: text().notNull(),
    description: text(),
    image: text(),
    // Backstage-style: `{ annotations, links }`, see util/meta.
    metadata: jsonb().$type<Metadata>().notNull().default({ annotations: {}, links: [] }),
  },
  (table) => [
    index("project_created_by").on(table.createdBy),
    index("project_metadata").using("gin", table.metadata),
  ],
);
