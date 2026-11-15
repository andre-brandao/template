import { sql } from "drizzle-orm";
import { index, integer, jsonb, snakeCase, text, uniqueIndex } from "drizzle-orm/pg-core";
import type { Metadata } from "../util/meta";
import { id, timestamp, timestamps, ulid } from "../drizzle/types";

export const StatusValues = ["backlog", "planned", "active", "blocked", "done"] as const;

export const TodoTable = snakeCase.table(
  "todo",
  {
    id: id(),
    ...timestamps,
    createdBy: ulid().notNull(),
    assignee: ulid(),
    // The entity this todo hangs off — "project" today, anything later. Same
    // convention as `event`, so nothing needs a migration to gain todos.
    source: text(),
    sourceID: ulid(),
    // Sub-issue of another todo with the same owner; cycles are refused in core.
    parentID: ulid(),
    // Dense 0..n-1 among live siblings.
    position: integer().notNull().default(0),
    // Free-form sprint label. Its date range is derived from the todos in it
    // (`Todo.stages`), so there is no second table to keep in sync.
    stage: text(),
    title: text().notNull(),
    body: text(),
    status: text({ enum: StatusValues }).notNull().default("backlog"),
    // `completed` / `not_planned` for done, a free note for blocked.
    reason: text(),
    tags: text().array().notNull().default([]),
    // Planned span.
    startDate: timestamp(),
    dueDate: timestamp(),
    // Actual span.
    timeStarted: timestamp(),
    timeDone: timestamp(),
    // Backstage-style: `{ annotations, links }`, see util/meta.
    metadata: jsonb().$type<Metadata>().notNull().default({ annotations: {}, links: [] }),
  },
  (table) => [
    index("todo_source").on(table.source, table.sourceID, table.status),
    index("todo_assignee").on(table.assignee, table.status),
    index("todo_stage").on(table.source, table.sourceID, table.stage),
    index("todo_parent").on(table.parentID, table.position),
    // One todo per GitHub issue: the webhook's lookup and the guard against a double import.
    uniqueIndex("todo_github_issue")
      .on(sql`(${table.metadata} -> 'annotations' ->> 'github.com/issue-id')`)
      .where(
        sql`${table.timeDeleted} is null and (${table.metadata} -> 'annotations') ? 'github.com/issue-id'`,
      ),
  ],
);

/**
 * Pipeline rank, not the alphabetical order the text column would give — a status sort
 * has to agree with the board columns and the picker.
 */
export const rank = sql.join(
  [
    sql`case`,
    ...StatusValues.map((status, at) => sql`when ${TodoTable.status} = ${status} then ${at}`),
    sql`end`,
  ],
  sql` `,
);
