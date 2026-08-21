import { z } from "zod";
import { and, eq, gt } from "drizzle-orm";
import { fn } from "../util/fn";
import { decode, digest, encode, equal } from "../util/hash";
import { Password } from "../util/password";
import { Actor } from "../actor";
import { Database } from "../drizzle";
import { ErrorCodes, VisibleError } from "../error";
import { Examples } from "../examples";
import { Identifier } from "../identifier";
import { Template } from "../lib/email/template";
import { KeyTable } from "../platform/key/key.sql";
import { User } from "./index";
import { UserTable } from "./user.sql";
import { OauthIds, ProviderIds, ProviderTable } from "./provider.sql";

/**
 * Who a login belongs to. `provision` and `tokens` are shared ground; each way in gets its
 * own namespace below, holding the schemas and storage only it understands.
 */
export namespace Auth {
  const Tokens = z.object({
    access: z.string(),
    refresh: z.string().nullable().optional(),
    expiresAt: z.date().nullable().optional(),
  });
  export type Tokens = z.infer<typeof Tokens>;

  /**
   * Resolves a login to a `userID`, from the issuer's `success` handler. Idempotent; a new
   * provider for a known email links onto that user. OAuth tokens are stored per login.
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

        // Linking a new provider onto a disabled account would hand it back — same guard.
        const byEmail = await tx
          .select({ id: UserTable.id, timeDeleted: UserTable.timeDeleted })
          .from(UserTable)
          .where(eq(UserTable.email, input.email))
          .then((rows) => rows.at(0));
        alive(byEmail);

        const userID =
          byEmail?.id ??
          (await User.create({ name: input.name ?? input.email, email: input.email })).id;

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
   * Stored OAuth tokens for `provider`, or null if not connected. Raw secrets — server-only.
   * Scoped to `OauthIds`: under `password` the same column holds the password hash.
   */
  export const tokens = fn(z.enum(OauthIds), (provider) =>
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

  /**
   * Password. There is no signup by password: an account is made by code or by OAuth and
   * gains a password afterwards, which is why `set` reads the address off the actor's own
   * row rather than taking one.
   */
  export namespace Pass {
    const Credentials = z.object({
      email: z.email().meta({
        description: "Login address on the account.",
        example: Examples.User.email,
      }),
      password: z.string().min(1).meta({ description: "The account's password." }),
    });

    /** Adds a password to the account already signed in, or replaces the one it has. */
    export const set = fn(
      z.object({
        password: z.string().min(8).meta({ description: "At least 8 characters." }),
      }),
      async (input) => {
        const me = await User.assert.exists(User.fromID(Actor.userID()));

        const hash = await Password.hash(input.password);
        await Database.use((tx) =>
          tx
            .insert(ProviderTable)
            .values({
              id: Identifier.create("provider"),
              userID: me.id,
              providerId: "password",
              accountId: me.email,
              accessToken: hash,
            })
            // Emails are unique and never reassigned, so the only row this can collide with
            // is this account's own earlier password — which is what a change replaces.
            .onConflictDoUpdate({
              target: [ProviderTable.providerId, ProviderTable.accountId],
              set: { accessToken: hash, timeUpdated: new Date() },
            }),
        );
      },
    );

    /** The other half. Returns the `userID` — minting the session is the caller's to own. */
    export const login = fn(Credentials, async (input) => {
      const row = await account(input.email);
      // One message for both halves, so a wrong password can't confirm a real address.
      if (!row?.hash || !(await Password.verify(input.password, row.hash)))
        throw new VisibleError(
          "authentication",
          ErrorCodes.Authentication.INVALID_CREDENTIALS,
          "Invalid email or password",
        );
      alive(row);
      return row.userID;
    });
  }

  /**
   * Login by emailed code. Nothing to remember and no password row to own: the code is the
   * credential, held hashed in the `key` table under `type: "code"` and spent on first use.
   * Doubles as signup, the same way an OAuth login does.
   */
  export namespace Code {
    /** Ten minutes from send to use. */
    const TTL = 10 * 60 * 1000;

    /** Six digits is only a million guesses, which is why `verify` spends the row either way. */
    const LENGTH = 6;

    const Input = z.object({
      email: z.email().meta({
        description: "Where the code is sent.",
        example: Examples.User.email,
      }),
    });

    export const request = fn(Input, async (input) => {
      const code = Array.from(crypto.getRandomValues(new Uint32Array(LENGTH)), (n) => n % 10).join(
        "",
      );

      await Database.transaction(async (tx) => {
        // One live code per address, so asking again retires the last one.
        await tx
          .delete(KeyTable)
          .where(and(eq(KeyTable.type, "code"), eq(KeyTable.name, input.email)));
        await tx.insert(KeyTable).values({
          id: Identifier.create("key"),
          name: input.email,
          // Salted by address, so two people holding the same code can't collide on the
          // unique index — and a stolen row can't be replayed against another account.
          key: encode(await digest(`${input.email}:${code}`)),
          type: "code",
          expiresAt: new Date(Date.now() + TTL),
        });
      });

      await Template.Send.loginCode(input.email, code);
    });

    export const verify = fn(
      Input.extend({
        code: z.string().min(1).meta({ description: "The code from the email." }),
      }),
      async (input) => {
        // Spent on the attempt, not on the match: six digits fall to a million tries, and
        // deleting first is what a retry counter would otherwise have to buy. A typo costs
        // a new code. Racing requests both delete, only one gets the row back.
        const spent = await Database.use((tx) =>
          tx
            .delete(KeyTable)
            .where(
              and(
                eq(KeyTable.type, "code"),
                eq(KeyTable.name, input.email),
                gt(KeyTable.expiresAt, new Date()),
              ),
            )
            .returning({ key: KeyTable.key }),
        );

        const hash = await digest(`${input.email}:${input.code.replace(/\D/g, "")}`);
        if (!spent[0] || !equal(hash, decode(spent[0].key)))
          throw new VisibleError(
            "authentication",
            ErrorCodes.Authentication.INVALID_CREDENTIALS,
            "That code is wrong or has expired",
          );

        return provision({ provider: "email", accountId: input.email, email: input.email });
      },
    );
  }

  /**
   * Magic links — not built. The shape when it lands: `request({ email, url })` mints a long
   * token into the `key` table under `type: "link"` and mails `${url}?token=…`, and
   * `verify({ token })` spends it and provisions. The token is wide enough that `Code`'s
   * spend-on-attempt rule buys nothing, but whatever consumes it has to be a POST — mail
   * scanners prefetch links, and a GET would burn one before its owner clicked.
   */
  export namespace Link {}

  // === UTILS ===

  /** Turn disabled accounts away at login, not at the first query after. */
  function alive(row?: { timeDeleted: Date | null }) {
    if (!row?.timeDeleted) return;
    throw new VisibleError(
      "forbidden",
      ErrorCodes.Permission.ACCOUNT_RESTRICTED,
      "This account has been disabled",
    );
  }

  /** The password row for an address, aliased away from the column it shares with OAuth. */
  function account(email: string) {
    return Database.use((tx) =>
      tx
        .select({
          userID: ProviderTable.userID,
          hash: ProviderTable.accessToken,
          timeDeleted: UserTable.timeDeleted,
        })
        .from(ProviderTable)
        .innerJoin(UserTable, eq(UserTable.id, ProviderTable.userID))
        .where(and(eq(ProviderTable.providerId, "password"), eq(ProviderTable.accountId, email)))
        .then((rows) => rows.at(0)),
    );
  }
}
