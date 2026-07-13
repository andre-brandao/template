import { index, pgTable as table, text, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { id, timestamps, ulid } from "../drizzle/types";

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
    password: varchar("password", { length: 255 }),
  },
  (table) => [
    uniqueIndex("provider_account").on(table.providerId, table.accountId),
    index("provider_user").on(table.userID),
  ],
);
