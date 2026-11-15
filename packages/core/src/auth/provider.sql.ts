import { index, pgTable as table, text, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { id, timestamps, ulid } from "../drizzle/types";

export const ProviderIds = ["email", "password", "github", "google"] as const;
export type ProviderId = (typeof ProviderIds)[number];

/** The subset served by the issuer, local or shared. The rest are the app's own. */
export const OauthIds = ["github", "google"] as const;

/** One login linked to a user. OAuth tokens stay at the issuer; apps never hold them. */
export const ProviderTable = table(
  "provider",
  {
    id: id(),
    ...timestamps,
    userID: ulid("user_id").notNull(),
    providerId: text("provider_id", { enum: ProviderIds }).notNull(),
    accountId: varchar("account_id", { length: 255 }).notNull(),
    /** The password hash under `password`. Null for every other provider. */
    secret: text(),
  },
  (table) => [
    uniqueIndex("provider_account").on(table.providerId, table.accountId),
    index("provider_user").on(table.userID),
  ],
);
