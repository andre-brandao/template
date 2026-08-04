import { index, pgTable as table, text } from "drizzle-orm/pg-core";
import { id, timestamp, timestamps, ulid } from "../drizzle/types";

export const StatusValues = ["backlog", "planned", "active", "blocked", "done"] as const;

export const TodoTable = table(
  "todo",
  {
    id: id(),
    ...timestamps,
    createdBy: ulid("created_by").notNull(),
    assignee: ulid("assignee"),
    // The entity this todo hangs off — "project" today, anything later. Same
    // convention as `event`, so nothing needs a migration to gain todos.
    source: text(),
    sourceID: ulid("source_id"),
    // Free-form sprint label. Its date range is derived from the todos in it
    // (`Todo.stages`), so there is no second table to keep in sync.
    stage: text(),
    title: text("title").notNull(),
    body: text(),
    status: text({ enum: StatusValues }).notNull().default("backlog"),
    // `completed` / `not_planned` for done, a free note for blocked.
    reason: text(),
    tags: text().array().notNull().default([]),
    // Planned span.
    startDate: timestamp("start_date"),
    dueDate: timestamp("due_date"),
    // Actual span.
    timeStarted: timestamp("time_started"),
    timeDone: timestamp("time_done"),
  },
  (table) => [
    index("todo_source").on(table.source, table.sourceID, table.status),
    index("todo_assignee").on(table.assignee, table.status),
    index("todo_stage").on(table.source, table.sourceID, table.stage),
  ],
);
