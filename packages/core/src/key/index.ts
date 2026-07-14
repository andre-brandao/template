import { z } from "zod";
import { and, desc, eq, gt, isNull, or } from "drizzle-orm";
import { fn } from "../util/fn";
import { found } from "../error";
import { Actor } from "../actor";
import { Common } from "../common";
import { Database } from "../drizzle";
import { Examples } from "../examples";
import { Identifier } from "../identifier";
import { KeyTable, KeyTypes } from "./key.sql";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export namespace Key {
  export const Info = z
    .object({
      id: z.string().meta({ description: Common.IdDescription, example: Examples.Key.id }),
      type: z.enum(KeyTypes).meta({
        description: "`api` keys are user-minted and never expire; `session` keys back a login.",
      }),
      name: z.string().min(1).max(255),
      key: z.string().nullable().meta({
        description:
          "The secret, for `api` keys only. Null for `session` keys — a login token is never handed back out.",
      }),
      display: z.string().meta({ description: "Masked secret, safe to show in a list." }),
      timeUsed: z.iso
        .datetime()
        .nullable()
        .meta({ description: "When the key last authenticated a request." }),
      expiresAt: z.iso
        .datetime()
        .nullable()
        .meta({ description: "When the key stops working. Null for `api` keys." }),
      current: z
        .boolean()
        .meta({ description: "Whether this is the key authenticating the current request." }),
    })
    .meta({
      ref: "Key",
      description: "An API key or an active session belonging to a user.",
      example: Examples.Key,
    });
  export type Info = z.infer<typeof Info>;

  /**
   * Takes `userID` rather than reading the actor, because register/login mint a
   * key before there is an actor to read. Unlike `list`, this returns the raw
   * secret — it's the only time a `session` secret is ever handed out.
   */
  export const create = fn(
    z.object({
      userID: Identifier.schema("user"),
      type: z.enum(KeyTypes).optional(),
      name: Info.shape.name,
      expiresAt: z.date().nullable().optional(),
    }),
    (input) =>
      Database.use((tx) =>
        tx
          .insert(KeyTable)
          .values({
            id: Identifier.create("key"),
            userID: input.userID,
            type: input.type ?? "api",
            name: input.name,
            key: token(),
            expiresAt: input.expiresAt ?? null,
          })
          .returning()
          .then((rows) => ({ ...serialize(rows[0]!), key: rows[0]!.key })),
      ),
  );

  /** Resolves a secret to its user, stamping `time_used` in the same round-trip. */
  export const verify = fn(z.string(), (key) =>
    Database.use((tx) =>
      tx
        .update(KeyTable)
        .set({ timeUsed: new Date() })
        .where(and(eq(KeyTable.key, key), isNull(KeyTable.timeDeleted), live()))
        .returning({ userID: KeyTable.userID })
        .then((rows) => rows.at(0)?.userID ?? null),
    ),
  );

  /**
   * Every live key the user has — API keys *and* sessions, so they can see and
   * revoke logins from other devices. Pass the caller's own secret to have its
   * key flagged `current`; `session` secrets are withheld either way.
   */
  export const list = fn(z.string().optional(), (current) =>
    Database.use((tx) =>
      tx
        .select()
        .from(KeyTable)
        .where(and(eq(KeyTable.userID, Actor.userID()), isNull(KeyTable.timeDeleted), live()))
        .orderBy(desc(KeyTable.timeCreated))
        .then((rows) => rows.map((row) => serialize(row, current))),
    ),
  );

  /** Revokes an API key or a session — including the caller's own, which logs them out. */
  export const remove = fn(Info.shape.id, async (id) =>
    found(
      "Key",
      await Database.use((tx) =>
        tx
          .update(KeyTable)
          .set({ timeDeleted: new Date() })
          .where(
            and(
              eq(KeyTable.id, id),
              eq(KeyTable.userID, Actor.userID()),
              isNull(KeyTable.timeDeleted),
            ),
          )
          .returning({ id: KeyTable.id })
          .then((rows) => rows.at(0)),
      ),
    ),
  );

  /** Revokes by secret rather than id — the logout path holds the token, not the id. */
  export const revoke = fn(z.string(), (key) =>
    Database.use((tx) =>
      tx
        .update(KeyTable)
        .set({ timeDeleted: new Date() })
        .where(and(eq(KeyTable.key, key), isNull(KeyTable.timeDeleted))),
    ),
  );

  /** Unexpired: `api` keys have no expiry, `session` keys must not be past theirs. */
  function live() {
    return or(isNull(KeyTable.expiresAt), gt(KeyTable.expiresAt, new Date()));
  }

  function token() {
    const bytes = new Uint32Array(64);
    crypto.getRandomValues(bytes);
    return "sk-" + Array.from(bytes, (n) => CHARS[n % CHARS.length]!).join("");
  }

  function serialize(row: typeof KeyTable.$inferSelect, current?: string): Info {
    return {
      id: row.id,
      type: row.type,
      name: row.name,
      key: row.type === "api" ? row.key : null,
      display: `${row.key.slice(0, 7)}...${row.key.slice(-4)}`,
      timeUsed: row.timeUsed?.toISOString() ?? null,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      current: row.key === current,
    };
  }
}
