import { index, snakeCase, text, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { id, timestamp, timestamps, ulid } from "../../drizzle/types";

/**
 * A user's grant to an external API — what an integration calls GitHub, Google or Slack with.
 * Not a login: those are `provider` rows and carry no tokens. Tokens are plaintext, like the
 * secrets an integration must replay, so a dump exposes them; only `Connection.tokens` reads them.
 */
export const ConnectionTable = snakeCase.table(
  "connection",
  {
    id: id(),
    ...timestamps,
    userID: ulid().notNull(),
    /** Free-form, so an app adds integrations without touching an enum: `github`, `slack`. */
    provider: varchar({ length: 64 }).notNull(),
    /** The account at the provider, so a reconnect can tell a different account apart. */
    accountId: varchar({ length: 255 }),
    scopes: text().array().notNull().default([]),
    accessToken: text().notNull(),
    refreshToken: text(),
    tokenExpiresAt: timestamp(),
  },
  (table) => [
    uniqueIndex("connection_user_provider").on(table.userID, table.provider),
    index("connection_user").on(table.userID),
  ],
);
