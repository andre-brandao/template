import { index, pgTable as table, text, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { id, timestamp, timestamps, ulid } from "../drizzle/types";

/**
 * Secrets. The value is stored plaintext; expiry is optional (null = never).
 *
 * `type` separates the two kinds that live here: `api` keys are user-minted bearer
 * tokens, `signing` keys are app-level (no user) and only ever HMAC signed URLs.
 * Auth resolves `api` alone, so a signing secret can't be spent as a bearer token.
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
