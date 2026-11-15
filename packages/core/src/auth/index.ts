import { z } from "zod";
import { and, eq, gt } from "drizzle-orm";
import { fn } from "../util/fn";
import { decode, digest, encode, equal } from "../util/hash";
import { Password } from "../util/password";
import { Context } from "../context";
import { Identity } from "../identity";
import { Permission } from "../permission";
import { Database } from "../drizzle";
import { ErrorCodes, VisibleError } from "../error";
import { Examples } from "../examples";
import { Identifier } from "../identifier";
import { Template } from "../lib/email/template";
import { Key } from "../platform/key";
import { KeyTable } from "../platform/key/key.sql";
import { User } from "../user";
import { zone } from "../user/prefs";
import { UserTable } from "../user/user.sql";
import { Delegation } from "./delegation";
import { ProviderIds, ProviderTable } from "./provider.sql";

/**
 * Credentials in, `Identity` out. `link` ties a login to a local user; `resolve` turns any
 * bearer into whoever is acting. Each way in gets its own namespace below.
 */
export namespace Auth {
  /**
   * What the issuer vouches for — the OpenAuth `identity` subject. App-agnostic on purpose: no
   * local `userID`, so one issuer can serve every app, and each app links it to its own row.
   */
  export const Subject = z.object({
    /** Stable at the issuer: `<provider>:<id at the provider>`. */
    id: z.string(),
    provider: z.enum(ProviderIds),
    email: z.email(),
    name: z.string().optional(),
  });
  export type Subject = z.infer<typeof Subject>;

  /** A verified issuer token. `aud` is the OAuth client it was minted for. */
  export type Claims = { aud: string; subject: Subject };

  /**
   * Verifies issuer JWTs. A port because the verifier is OpenAuth's client, which the targets
   * hold — core never imports it. Unset means no issuer: JWTs are refused.
   */
  export const Issuer = Context.port<{ verify(token: string): Promise<Claims | null> } | null>(
    () => null,
  );

  /** OAuth clients whose tokens act as an agent, not as the person: MCP clients register as `mcp:<name>`. */
  const AGENT = "mcp:";

  /**
   * Resolves a login to a `userID`. Idempotent; a new provider for a known email links onto
   * that user. Bots are never linked — nobody logs in as one.
   */
  export const link = fn(
    z.object({
      provider: z.enum(ProviderIds),
      /** The identity at the provider — its own id, or the email for email/code. */
      accountId: z.string(),
      email: z.email(),
      name: z.string().min(1).optional(),
    }),
    (input) =>
      Database.transaction(async (tx) => {
        const linked = await tx
          .select({
            userID: ProviderTable.userID,
            timeDeleted: UserTable.timeDeleted,
            kind: UserTable.kind,
          })
          .from(ProviderTable)
          .innerJoin(UserTable, eq(UserTable.id, ProviderTable.userID))
          .where(
            and(
              eq(ProviderTable.providerId, input.provider),
              eq(ProviderTable.accountId, input.accountId),
            ),
          )
          .then((rows) => rows.at(0));
        alive(linked);
        if (linked) return linked.userID;

        // Linking a new provider onto a disabled account would hand it back — same guard.
        const known = await tx
          .select({ id: UserTable.id, timeDeleted: UserTable.timeDeleted, kind: UserTable.kind })
          .from(UserTable)
          .where(eq(UserTable.email, input.email))
          .then((rows) => rows.at(0));
        alive(known);

        const userID =
          known?.id ??
          (await User.create({ name: input.name ?? input.email, email: input.email })).id;

        await tx.insert(ProviderTable).values({
          id: Identifier.create("provider"),
          userID,
          providerId: input.provider,
          accountId: input.accountId,
        });

        return userID;
      }),
  );

  /**
   * Any bearer to whoever is acting, or a thrown 401: `agt-` delegations, `sk-` keys, then
   * issuer JWTs. Dashboard sessions are cookies only — an agent gets a delegation instead.
   * `audience` is who is asking: a token minted for an MCP client only works on the MCP.
   */
  export async function resolve(token: string, audience: "api" | "mcp" = "api") {
    if (token.startsWith("agt-")) {
      const lent = await Delegation.verify(token);
      if (!lent) invalid("Invalid or expired delegation");
      return identify(lent.userID, { name: lent.name, scope: lent.scope, credential: lent.id });
    }

    if (token.startsWith("sk-")) {
      const key = await Key.verify(token);
      if (!key) invalid("Invalid or expired API key");
      return identify(key.userID, { credential: key.id });
    }

    const claims = await Issuer.use()?.verify(token);
    if (!claims) invalid("Invalid or expired token");
    const userID = await link({
      provider: claims.subject.provider,
      accountId: claims.subject.id,
      email: claims.subject.email,
      name: claims.subject.name,
    });
    if (!claims.aud.startsWith(AGENT)) return identify(userID);
    if (audience !== "mcp") invalid("This token was issued for an MCP client");
    return identify(userID, { name: claims.aud.slice(AGENT.length) });
  }

  /**
   * The identity a `userID` acts as. The role always comes from the row, so no credential can
   * outlive the permissions of the user behind it. A `name` makes it an agent acting for them;
   * a bot carries its owner, and stops resolving once they are disabled.
   */
  export async function identify(
    userID: string,
    opts: { name?: string; scope?: Permission.Grants; credential?: string } = {},
  ): Promise<Identity.Info> {
    const row = await User.fromID(userID);
    if (!row) invalid("Token belongs to a user that no longer exists");
    const base = { userID, role: row.role, credential: opts.credential };
    if (row.kind === "bot") {
      const owner = row.ownerID ? await User.fromID(row.ownerID) : null;
      if (!owner) invalid("This bot's owner is no longer active");
      return {
        type: "bot",
        properties: { ...base, owner: { userID: owner.id, role: owner.role } },
      };
    }
    const timezone = zone(row.prefs);
    if (opts.name)
      return {
        type: "agent",
        properties: { ...base, name: opts.name, scope: opts.scope, timezone },
      };
    return { type: "user", properties: { ...base, timezone } };
  }

  /**
   * Password. There is no signup by password: an account is made by code or by OAuth and
   * gains a password afterwards, which is why `set` reads the address off the identity's own
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
        const me = await User.assert.exists(User.fromID(Identity.userID()));

        const hash = await Password.hash(input.password);
        await Database.use((tx) =>
          tx
            .insert(ProviderTable)
            .values({
              id: Identifier.create("provider"),
              userID: me.id,
              providerId: "password",
              accountId: me.email,
              secret: hash,
            })
            // Emails are unique and never reassigned, so the only row this can collide with
            // is this account's own earlier password — which is what a change replaces.
            .onConflictDoUpdate({
              target: [ProviderTable.providerId, ProviderTable.accountId],
              set: { secret: hash, timeUpdated: new Date() },
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

        return link({ provider: "email", accountId: input.email, email: input.email });
      },
    );
  }

  /**
   * Magic links — not built. The shape when it lands: `request({ email, url })` mints a long
   * token into the `key` table under `type: "link"` and mails `${url}?token=…`, and
   * `verify({ token })` spends it and links. Whatever consumes it has to be a POST — mail
   * scanners prefetch links, and a GET would burn one before its owner clicked.
   */
  export namespace Link {}

  /**
   * Signed inbound webhooks — not built. An external system posting with an HMAC over the body
   * resolves to a `bot` identity: the secret lives in the `key` table under `type: "signing"`,
   * owned by the bot's user row, and verifying it is the whole adapter.
   */
  export namespace Signature {}

  // === UTILS ===

  /** Turn disabled accounts and bots away at login, not at the first query after. */
  function alive(row?: { timeDeleted: Date | null; kind?: "human" | "bot" }) {
    if (row?.kind === "bot")
      throw new VisibleError(
        "forbidden",
        ErrorCodes.Permission.ACCOUNT_RESTRICTED,
        "Bot accounts can't log in",
      );
    if (!row?.timeDeleted) return;
    throw new VisibleError(
      "forbidden",
      ErrorCodes.Permission.ACCOUNT_RESTRICTED,
      "This account has been disabled",
    );
  }

  function invalid(message: string): never {
    throw new VisibleError("authentication", ErrorCodes.Authentication.INVALID_TOKEN, message);
  }

  /** The password row for an address. */
  function account(email: string) {
    return Database.use((tx) =>
      tx
        .select({
          userID: ProviderTable.userID,
          hash: ProviderTable.secret,
          timeDeleted: UserTable.timeDeleted,
          kind: UserTable.kind,
        })
        .from(ProviderTable)
        .innerJoin(UserTable, eq(UserTable.id, ProviderTable.userID))
        .where(and(eq(ProviderTable.providerId, "password"), eq(ProviderTable.accountId, email)))
        .then((rows) => rows.at(0)),
    );
  }
}
