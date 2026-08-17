import { index, jsonb, pgTable as table, text, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { id, timestamp, timestamps, ulid } from "../../drizzle/types";

/**
 * Secrets; null expiry = never. `type` separates user-minted `api` bearer tokens from
 * app-level `signing` keys — auth resolves `api` alone. Everything a user holds is stored as
 * `encode(digest(secret))`, so a dump of this table authenticates nothing. `signing` is the
 * exception: the app has to reproduce that one to sign with it.
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
    // Whatever a key's own type wants remembered — the mask for an `api` key, the device
    // for a `session`. Each namespace owns the shape it parses out of here.
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
