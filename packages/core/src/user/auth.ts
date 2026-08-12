import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { fn } from "../util/fn";
import { Actor } from "../actor";
import { Database } from "../drizzle";
import { ErrorCodes, VisibleError } from "../error";
import { Identifier } from "../identifier";
import { User } from "./index";
import { UserTable } from "./user.sql";
import { ProviderIds, ProviderTable } from "./provider.sql";

export namespace Auth {
  /**
   * A disabled account is turned away at the door rather than at the first query, so a
   * logout/login round-trip can't hand the session back and bounce them off `fromID`.
   */
  function alive(row?: { timeDeleted: Date | null }) {
    if (!row?.timeDeleted) return;
    throw new VisibleError(
      "forbidden",
      ErrorCodes.Permission.ACCOUNT_RESTRICTED,
      "This account has been disabled",
    );
  }

  const Tokens = z.object({
    access: z.string(),
    refresh: z.string().nullable().optional(),
    expiresAt: z.date().nullable().optional(),
  });
  export type Tokens = z.infer<typeof Tokens>;

  /**
   * Resolves an authenticated identity to a `userID`, called from the OpenAuth
   * issuer's `success` handler. Idempotent: a returning login lands on the same
   * user. A new provider for a known email links onto that user, so a password
   * account and a GitHub login for one address share a single user. Any `tokens`
   * (from an OAuth provider) are stored on the provider row and refreshed on every
   * login, so the app can later call that provider's API as the user.
   */
  export const provision = fn(
    z.object({
      provider: z.enum(ProviderIds),
      /** The identity at the provider — its own id, or the email for email/code. */
      accountId: z.string(),
      email: z.email(),
      name: z.string().min(1).optional(),
      tokens: Tokens.optional(),
    }),
    (input) =>
      Database.transaction(async (tx) => {
        const tokens = input.tokens && {
          accessToken: input.tokens.access,
          refreshToken: input.tokens.refresh ?? null,
          tokenExpiresAt: input.tokens.expiresAt ?? null,
        };

        const byProvider = await tx
          .select({ userID: ProviderTable.userID, timeDeleted: UserTable.timeDeleted })
          .from(ProviderTable)
          .innerJoin(UserTable, eq(UserTable.id, ProviderTable.userID))
          .where(
            and(
              eq(ProviderTable.providerId, input.provider),
              eq(ProviderTable.accountId, input.accountId),
            ),
          )
          .then((rows) => rows.at(0));
        alive(byProvider);
        if (byProvider) {
          if (tokens)
            await tx
              .update(ProviderTable)
              .set({ ...tokens, timeUpdated: new Date() })
              .where(
                and(
                  eq(ProviderTable.providerId, input.provider),
                  eq(ProviderTable.accountId, input.accountId),
                ),
              );
          return byProvider.userID;
        }

        // Matched on email, not provider: linking a second login onto a disabled account
        // would hand it back, so the same guard applies before the provider row is written.
        const byEmail = await tx
          .select({ id: UserTable.id, timeDeleted: UserTable.timeDeleted })
          .from(UserTable)
          .where(eq(UserTable.email, input.email))
          .then((rows) => rows.at(0));
        alive(byEmail);

        const userID =
          byEmail?.id ??
          (await User.create({ name: input.name ?? input.email, email: input.email }));

        await tx.insert(ProviderTable).values({
          id: Identifier.create("provider"),
          userID,
          providerId: input.provider,
          accountId: input.accountId,
          ...tokens,
        });

        return userID;
      }),
  );

  /**
   * The stored OAuth tokens for the current user's connection to `provider`, or
   * null if not connected. Returns the raw secrets — server-only, for calling the
   * provider's API as the user.
   */
  export const tokens = fn(z.enum(ProviderIds), (provider) =>
    Database.use((tx) =>
      tx
        .select({
          access: ProviderTable.accessToken,
          refresh: ProviderTable.refreshToken,
          expiresAt: ProviderTable.tokenExpiresAt,
        })
        .from(ProviderTable)
        .where(
          and(eq(ProviderTable.userID, Actor.userID()), eq(ProviderTable.providerId, provider)),
        )
        .then((rows) => {
          const row = rows.at(0);
          return row?.access ? row : null;
        }),
    ),
  );
}
