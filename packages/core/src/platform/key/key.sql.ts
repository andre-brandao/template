import { index, pgTable as table, text, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { id, timestamp, timestamps, ulid } from "../drizzle/types";

/**
 * Secrets, stored plaintext; null expiry = never. `type` separates user-minted `api`
 * bearer tokens from app-level `signing` keys — auth resolves `api` alone.
 */
export const KeyTable = table(
  "key",
  {
    id: id(),
    ...timestamps,
    userID: ulid("user_id"),
    name: varchar("name", { length: 255 }).notNull(),
    key: varchar("key", { length: 128 }).notNull(),
    type: text().notNull().default("api"),
    expiresAt: timestamp("expires_at"),
    timeUsed: timestamp("time_used"),
  },
  (table) => [
    uniqueIndex("key_value").on(table.key),
    index("key_user").on(table.userID),
    index("key_type").on(table.type),
  ],
);
