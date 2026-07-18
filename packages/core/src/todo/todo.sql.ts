import { index, pgTable as table, text } from "drizzle-orm/pg-core";
import { id, timestamp, timestamps, ulid } from "../drizzle/types";

export const TodoTable = table(
  "todo",
  {
    id: id(),
    ...timestamps,
    userID: ulid("user_id").notNull(),
    title: text("title").notNull(),
    body: text(),
    state: text().notNull().default("open"),
    stateReason: text("state_reason"),
    tags: text().array().notNull().default([]),
    dueDate: timestamp("due_date"),
  },
  (table) => [index("todo_user").on(table.userID, table.state)],
);
