import { gt, isNull, or } from "drizzle-orm";
import { index, jsonb, snakeCase, text, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { id, timestamp, timestamps, ulid } from "../../drizzle/types";

// Plain text in SQL; the union only guards writes and narrows reads.
const types = ["api", "code", "session", "agent", "signing", "hook"] as const;

/**
 * Every secret the app holds, by `type`; null expiry = never. Hashed, except `signing` and
 * `hook`, which the app has to reproduce.
 */
export const KeyTable = snakeCase.table(
  "key",
  {
    id: id(),
    ...timestamps,
    userID: ulid(),
    name: varchar({ length: 255 }).notNull(),
    key: varchar({ length: 128 }).notNull(),
    type: text().$type<(typeof types)[number]>().notNull().default("api"),
    // Whatever a key's own type wants remembered, like the mask for an `api` key.
    meta: jsonb().notNull().default({}),
    expiresAt: timestamp(),
    timeUsed: timestamp(),
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
