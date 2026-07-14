import { index, pgTable as table, text, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { id, timestamp, timestamps, ulid } from "../drizzle/types";

/** `session` keys back a login and expire; `api` keys are user-minted and never do. */
export const KeyTypes = ["session", "api"] as const;
export type KeyType = (typeof KeyTypes)[number];

export const KeyTable = table(
  "key",
  {
    id: id(),
    ...timestamps,
    userID: ulid("user_id").notNull(),
    type: text("type", { enum: KeyTypes }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    key: varchar("key", { length: 128 }).notNull(),
    expiresAt: timestamp("expires_at"),
    timeUsed: timestamp("time_used"),
  },
  (table) => [uniqueIndex("key_value").on(table.key), index("key_user").on(table.userID)],
);
