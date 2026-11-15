import { gt, isNull, or } from "drizzle-orm";
import { index, jsonb, pgTable as table, text, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { id, timestamp, timestamps, ulid } from "../../drizzle/types";

/**
 * Every secret the app holds, by `type`; null expiry = never. Hashed, except `signing` and
 * `hook`, which the app has to reproduce.
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
    // Whatever a key's own type wants remembered, like the mask for an `api` key.
    meta: jsonb().notNull().default({}),
    expiresAt: timestamp("expires_at"),
    timeUsed: timestamp("time_used"),
  },
  (table) => [
    uniqueIndex("key_value").on(table.key),
    index("key_user").on(table.userID),
    index("key_type").on(table.type),
  ],
);

/** How stale the last use has to be before a read is worth a write. */
export const TOUCH = 60 * 60 * 1000;

/** Unexpired: no expiry set, or expiry still in the future. */
export function live() {
  return or(isNull(KeyTable.expiresAt), gt(KeyTable.expiresAt, new Date()));
}
