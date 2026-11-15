import { index, jsonb, snakeCase, text } from "drizzle-orm/pg-core";
import { id, timestamps, ulid } from "../../drizzle/types";

/** A json-render spec, opaque here: the browser's catalog validates its elements. */
export type Spec = {
  root: string;
  elements: Record<string, { type: string; props: Record<string, unknown>; children: string[] }>;
};

/** A panel the agent built and someone saved. Only the spec is kept, never its rows. */
export const PanelTable = snakeCase.table(
  "panel",
  {
    id: id(),
    ...timestamps,
    createdBy: ulid().notNull(),
    title: text().notNull(),
    spec: jsonb().$type<Spec>().notNull(),
  },
  (table) => [index("panel_time_updated").on(table.timeUpdated)],
);
