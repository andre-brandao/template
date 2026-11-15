import { index, jsonb, snakeCase, text } from "drizzle-orm/pg-core";
import { id, timestamps, ulid } from "../../drizzle/types";
import type { Identity } from "../../identity";

export const EventTable = snakeCase.table(
  "event",
  {
    id: id(),
    ...timestamps,
    userID: ulid(),
    // The whole identity as it stood: an agent's name and scope, the role it held.
    identity: jsonb().$type<Identity.Info>().notNull().default({ type: "public", properties: {} }),
    type: text().notNull(),
    source: text(),
    sourceID: ulid(),
    tags: text().array().notNull().default([]),
    data: jsonb().notNull().default({}),
  },
  (table) => [
    index("event_user").on(table.userID),
    index("event_source").on(table.source, table.sourceID),
    index("event_type").on(table.type),
    index("event_tags").using("gin", table.tags),
  ],
);
