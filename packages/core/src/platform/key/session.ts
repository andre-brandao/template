import { z } from "zod";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import { fn } from "../../util/fn";
import { Common } from "../../common";
import { Database } from "../../drizzle";
import { Examples } from "../../examples";
import { Identifier } from "../../identifier";
import { Permission } from "../../permission";
import { token } from "../../util/token";
import { UserTable } from "../../user/user.sql";
import { KeyTable } from "./key.sql";

/**
 * Dashboard logins. Nothing is signed, so there is no secret to hold or rotate: the cookie
 * carries a random token, the row is what makes it true, and revoking one is a delete.
 * Shares the `key` table under `type: "session"`; `Key.verify` resolves `api` alone, so a
 * session token can never authenticate as a bearer token.
 */
export namespace Session {
  export const Info = z
    .object({
      userID: z.string().meta({ description: Common.IdDescription, example: Examples.User.id }),
      email: z.email().meta({
        description: "Login address on the account.",
        example: Examples.User.email,
      }),
      role: z.enum(Permission.roles).meta({
        description: "Read off the user row on every request, so a change takes effect at once.",
      }),
    })
    .meta({
      ref: "Session",
      description: "Who the `auth` cookie belongs to, resolved from the session row.",
      example: Examples.Session,
    });
  export type Info = z.infer<typeof Info>;

  export const TTL = 60 * 60 * 24 * 30;

  /**
   * Only the digest is stored, so a dump of the table can't be replayed. The token is
   * high-entropy, so a plain hash is enough — unlike a password, there is nothing here
   * worth the per-request cost of PBKDF2.
   */
  async function digest(raw: string) {
    const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
    return btoa(String.fromCharCode(...new Uint8Array(bytes)));
  }

  /** Hands back the raw token — the only moment it exists outside the cookie. */
  export const create = fn(Identifier.schema("user"), async (user) => {
    const raw = token("ses-");
    const hash = await digest(raw);
    await Database.use((tx) =>
      tx.insert(KeyTable).values({
        id: Identifier.create("key"),
        userID: user,
        name: "dashboard",
        key: hash,
        type: "session",
        expiresAt: new Date(Date.now() + TTL * 1000),
      }),
    );
    return raw;
  });

  /**
   * The whole authenticated read: one indexed lookup answering who, what role, and whether
   * the session is still live. Expiry is a column, so nothing the client holds outlives it.
   */
  export const verify = fn(z.string(), async (raw) => {
    const hash = await digest(raw);
    return Database.use((tx) =>
      tx
        .select({ userID: UserTable.id, email: UserTable.email, role: UserTable.role })
        .from(KeyTable)
        .innerJoin(UserTable, eq(UserTable.id, KeyTable.userID))
        .where(
          and(
            eq(KeyTable.key, hash),
            eq(KeyTable.type, "session"),
            isNull(KeyTable.timeDeleted),
            isNull(UserTable.timeDeleted),
            or(isNull(KeyTable.expiresAt), gt(KeyTable.expiresAt, new Date())),
          ),
        )
        .then((rows) => rows.at(0) ?? null),
    );
  });

  /** Logout. Hard delete, so a copy lifted off the wire dies with the original. */
  export const remove = fn(z.string(), async (raw) => {
    const hash = await digest(raw);
    await Database.use((tx) =>
      tx.delete(KeyTable).where(and(eq(KeyTable.key, hash), eq(KeyTable.type, "session"))),
    );
  });
}
