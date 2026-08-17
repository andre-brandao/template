import { index, pgTable as table, text, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { id, timestamp, timestamps, ulid } from "../drizzle/types";

export const ProviderIds = ["email", "password", "github", "google"] as const;
export type ProviderId = (typeof ProviderIds)[number];

/** The subset that holds a real OAuth tokenset. `accessToken` means something else elsewhere. */
export const OauthIds = ["github", "google"] as const;

export const ProviderTable = table(
  "provider",
  {
    id: id(),
    ...timestamps,
    userID: ulid("user_id").notNull(),
    providerId: text("provider_id", { enum: ProviderIds }).notNull(),
    accountId: varchar("account_id", { length: 255 }).notNull(),
    // Whatever secret the provider hands back: an OAuth access token under `OauthIds`, the
    // password hash under `password`. Tokens are plaintext, like `key` secrets — a dump
    // exposes them — so only the hash may leave the row, and never through `Auth.tokens`.
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    tokenExpiresAt: timestamp("token_expires_at"),
  },
  (table) => [
    uniqueIndex("provider_account").on(table.providerId, table.accountId),
    index("provider_user").on(table.userID),
  ],
);
