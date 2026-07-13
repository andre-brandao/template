import { index, pgTable as table, text } from "drizzle-orm/pg-core";
import { id, timestamp, timestamps, ulid } from "../drizzle/types";

export const TodoStatuses = ["pending", "in_progress", "done"] as const;

export const TodoTable = table(
  "todo",
  {
    id: id(),
    ...timestamps,
    userID: ulid("user_id").notNull(),
    title: text("title").notNull(),
    status: text("status").notNull().default("pending"),
    dueDate: timestamp("due_date"),
  },
  (table) => [index("todo_user").on(table.userID)],
);
