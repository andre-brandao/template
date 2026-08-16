import { index, jsonb, pgTable as table, text } from "drizzle-orm/pg-core";
import { id, timestamps, ulid } from "../drizzle/types";

export const EventTable = table(
  "event",
  {
    id: id(),
    ...timestamps,
    userID: ulid("user_id"),
    type: text().notNull(),
    source: text(),
    sourceID: ulid("source_id"),
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
