import { index, pgTable as table, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { id, timestamp, timestamps, ulid } from "../drizzle/types";

/**
 * User-minted API keys. The secret is stored plaintext; expiry is optional
 * (null = never). Each key is bound to a role (and through it an org): it
 * authenticates as the user but acts with at most that role's permissions.
 */
export const KeyTable = table(
  "key",
  {
    id: id(),
    ...timestamps,
    userID: ulid("user_id").notNull(),
    roleID: ulid("role_id").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    key: varchar("key", { length: 128 }).notNull(),
    expiresAt: timestamp("expires_at"),
    timeUsed: timestamp("time_used"),
  },
  (table) => [
    uniqueIndex("key_value").on(table.key),
    index("key_user").on(table.userID),
    index("key_role").on(table.roleID),
  ],
);
