import { sql } from "drizzle-orm";
import {
  bigint,
  index,
  integer,
  jsonb,
  snakeCase,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { timestamp, timestamps, ulid } from "../../drizzle/types";

export const RoleValues = ["user", "assistant", "tool"] as const;

/** One thread with an agent. `time_updated` is its last activity. */
export const ConversationTable = snakeCase.table(
  "conversation",
  {
    id: uuid().primaryKey().defaultRandom(),
    ...timestamps,
    // A key of the dashboard's agent registry; free text so a new agent needs no migration.
    agent: varchar({ length: 64 }).notNull(),
    // The browser's TanStack thread id.
    thread: varchar({ length: 255 }).notNull(),
    userID: ulid().notNull(),
    title: varchar({ length: 200 }),
  },
  (table) => [
    uniqueIndex("conversation_thread")
      .on(table.thread)
      .where(sql`${table.timeDeleted} is null`),
    index("conversation_user").on(table.userID, table.agent, table.timeUpdated),
  ],
);

/** One message, as the model saw it. Run metrics sit on the run's last message. */
export const ConversationMessageTable = snakeCase.table(
  "conversation_message",
  {
    // An identity, so messages read back in insertion order.
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    conversationID: uuid().notNull(),
    runID: text(),
    role: text({ enum: RoleValues }).notNull(),
    // The TanStack ModelMessage, whole.
    content: jsonb().notNull(),
    // Plain text, for search.
    text: text(),
    tools: text().array().notNull().default([]),
    model: text(),
    tokensIn: integer(),
    tokensOut: integer(),
    durationMs: integer(),
    error: text(),
    timeCreated: timestamp().notNull().defaultNow(),
  },
  (table) => [
    index("conversation_message_conversation").on(table.conversationID, table.id),
    index("conversation_message_search").using(
      "gin",
      sql`to_tsvector('english', coalesce(${table.text}, ''))`,
    ),
  ],
);
