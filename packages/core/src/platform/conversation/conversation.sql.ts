import { sql } from "drizzle-orm";
import {
  bigint,
  index,
  integer,
  jsonb,
  pgTable as table,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { timestamp, timestamps, ulid } from "../../drizzle/types";

// DDL only: the dashboard's agent feature records and reads these itself.
export const RoleValues = ["user", "assistant", "tool"] as const;

/** One thread with an agent. `time_updated` is its last activity. */
export const ConversationTable = table(
  "conversation",
  {
    id: uuid().primaryKey().defaultRandom(),
    ...timestamps,
    // A key of the dashboard's agent registry; free text so a new agent needs no migration.
    agent: varchar("agent", { length: 64 }).notNull(),
    // The browser's TanStack thread id.
    thread: varchar("thread", { length: 255 }).notNull(),
    userID: ulid("user_id").notNull(),
    title: varchar("title", { length: 200 }),
  },
  (table) => [
    uniqueIndex("conversation_thread")
      .on(table.thread)
      .where(sql`${table.timeDeleted} is null`),
    index("conversation_user").on(table.userID, table.agent, table.timeUpdated),
  ],
);

/** One message, as the model saw it. Run metrics sit on the run's last message. */
export const ConversationMessageTable = table(
  "conversation_message",
  {
    // An identity, so messages read back in insertion order.
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    conversationID: uuid("conversation_id").notNull(),
    runID: text("run_id"),
    role: text({ enum: RoleValues }).notNull(),
    // The TanStack ModelMessage, whole.
    content: jsonb().notNull(),
    // Plain text, for search.
    text: text(),
    tools: text().array().notNull().default([]),
    model: text(),
    tokensIn: integer("tokens_in"),
    tokensOut: integer("tokens_out"),
    durationMs: integer("duration_ms"),
    error: text(),
    timeCreated: timestamp("time_created").notNull().defaultNow(),
  },
  (table) => [
    index("conversation_message_conversation").on(table.conversationID, table.id),
    index("conversation_message_search").using(
      "gin",
      sql`to_tsvector('english', coalesce(${table.text}, ''))`,
    ),
  ],
);
