import { index, pgTable as table, text, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { id, timestamp, timestamps, ulid } from "../drizzle/types";

export const ProviderIds = ["email", "github", "google"] as const;
export type ProviderId = (typeof ProviderIds)[number];

export const ProviderTable = table(
  "provider",
  {
    id: id(),
    ...timestamps,
    userID: ulid("user_id").notNull(),
    providerId: text("provider_id", { enum: ProviderIds }).notNull(),
    accountId: varchar("account_id", { length: 255 }).notNull(),
    // OAuth tokens for calling the provider's API as the user. Null for email/code.
    // Stored plaintext, like `key` secrets — a DB dump exposes them.
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    tokenExpiresAt: timestamp("token_expires_at"),
  },
  (table) => [
    uniqueIndex("provider_account").on(table.providerId, table.accountId),
    index("provider_user").on(table.userID),
  ],
);
