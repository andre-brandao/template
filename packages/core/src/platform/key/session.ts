import { z } from "zod";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import { fn } from "../../util/fn";
import { Common } from "../../common";
import { Database } from "../../drizzle";
import { Examples } from "../../examples";
import { Identifier } from "../../identifier";
import { Permission } from "../../permission";
import { decode, digest, encode, equal } from "../../util/hash";
import { token } from "../../util/token";
import { UserTable } from "../../user/user.sql";
import { KeyTable } from "./key.sql";

/**
 * Dashboard logins. Nothing is signed, so there is no secret to hold or rotate: the cookie
 * is `<id>.<secret>`, the row is what makes it true, and revoking one is a delete. Shares
 * the `key` table under `type: "session"`; `Key.verify` resolves `api` alone, so a session
 * can never authenticate as a bearer token.
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

  /** Idle window. Every use pushes it out, so only an unused session ever expires. */
  export const TTL = 60 * 60 * 24 * 30;

  /** How stale the last use has to be before a read is worth a write. */
  const TOUCH = 60 * 60 * 1000;

  /** Hands back the raw token — the only moment the secret exists outside the cookie. */
  export const create = fn(Identifier.schema("user"), async (user) => {
    const id = Identifier.create("key");
    const secret = token("ses-");
    const hash = encode(await digest(secret));
    const now = new Date();
    await Database.use((tx) =>
      tx.insert(KeyTable).values({
        id,
        userID: user,
        name: "dashboard",
        key: hash,
        type: "session",
        timeUsed: now,
        expiresAt: new Date(now.getTime() + TTL * 1000),
      }),
    );
    return `${id}.${secret}`;
  });

  /**
   * The whole authenticated read: one indexed lookup answering who, what role, and whether
   * the session is still live. Expiry is a column, so nothing the client holds outlives it.
   */
  export const verify = fn(z.string(), async (raw) => {
    const [id, secret] = raw.split(".");
    if (!id || !secret) return null;

    const row = await Database.use((tx) =>
      tx
        .select({
          hash: KeyTable.key,
          used: KeyTable.timeUsed,
          userID: UserTable.id,
          email: UserTable.email,
          role: UserTable.role,
        })
        .from(KeyTable)
        .innerJoin(UserTable, eq(UserTable.id, KeyTable.userID))
        .where(
          and(
            eq(KeyTable.id, id),
            eq(KeyTable.type, "session"),
            isNull(KeyTable.timeDeleted),
            isNull(UserTable.timeDeleted),
            or(isNull(KeyTable.expiresAt), gt(KeyTable.expiresAt, new Date())),
          ),
        )
        .then((rows) => rows.at(0)),
    );
    // The id is public, so the secret is what authenticates — compared here rather than in
    // the WHERE, where the database's own comparison would answer in variable time.
    if (!row || !equal(await digest(secret), decode(row.hash))) return null;

    // Slides the window, at most hourly, so an active session isn't a write per request.
    if (!row.used || Date.now() - row.used.getTime() >= TOUCH) await touch(id);

    return { userID: row.userID, email: row.email, role: row.role };
  });

  /** Logout. Hard delete, so a copy lifted off the wire dies with the original. */
  export const remove = fn(z.string(), async (raw) => {
    const [id, secret] = raw.split(".");
    if (!id || !secret) return;
    // Matching the secret too, so knowing an id is not enough to end someone's session.
    const hash = encode(await digest(secret));
    await Database.use((tx) =>
      tx.delete(KeyTable).where(and(eq(KeyTable.id, id), eq(KeyTable.key, hash))),
    );
  });

  // === UTILS ===

  function touch(id: string) {
    const now = new Date();
    return Database.use((tx) =>
      tx
        .update(KeyTable)
        .set({ timeUsed: now, expiresAt: new Date(now.getTime() + TTL * 1000) })
        .where(eq(KeyTable.id, id)),
    );
  }
}
