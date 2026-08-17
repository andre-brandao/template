import { z } from "zod";
import { and, desc, eq, gt, isNull, or } from "drizzle-orm";
import { fn } from "../../util/fn";
import { iso } from "../../util/fmt";
import { found } from "../../error";
import { Actor } from "../../actor";
import { Common } from "../../common";
import { Database } from "../../drizzle";
import { Examples } from "../../examples";
import { Identifier } from "../../identifier";
import { digest, encode } from "../../util/hash";
import { token } from "../../util/token";
import { KeyTable } from "./key.sql";

export namespace Key {
  export const Info = z
    .object({
      id: z.string().meta({ description: Common.IdDescription, example: Examples.Key.id }),
      name: z.string().min(1).max(255).meta({ description: "Label shown in the key list." }),
      display: z.string().meta({ description: "Masked secret, safe to show in a list." }),
      key: z.string().nullable().meta({
        description:
          "The secret, handed back in full the once so it can be copied. Null everywhere else — the row holds a hash, so a key that wasn't saved has to be replaced.",
      }),
      timeUsed: z.iso
        .datetime()
        .nullable()
        .meta({ description: "When the key last authenticated a request, to the hour." }),
      expiresAt: z.iso
        .datetime()
        .nullable()
        .meta({ description: "When the key stops working. Null means it never expires." }),
      current: z
        .boolean()
        .meta({ description: "Whether this is the key authenticating the current request." }),
    })
    .meta({
      ref: "Key",
      description: "An API key belonging to a user.",
      example: Examples.Key,
    });
  export type Info = z.infer<typeof Info>;

  /** What an `api` key's row remembers, now that the secret itself isn't kept. */
  const Meta = z.object({ display: z.string().default("") });

  /** How stale the last use has to be before a read is worth a write. */
  const TOUCH = 60 * 60 * 1000;

  /** A number of days from now as an expiry instant. No days means a key that never expires. */
  export function expires(days?: number) {
    return days ? new Date(Date.now() + days * 86_400_000) : null;
  }

  /**
   * Takes `userID` so a key can be minted before an actor exists. The only moment the secret
   * exists outside the caller's hands: the row keeps a hash, so nothing can hand it back later.
   */
  export const create = fn(
    z.object({
      userID: Identifier.schema("user"),
      name: Info.shape.name,
      expiresAt: z.date().nullable().optional(),
    }),
    async (input) => {
      const secret = token("sk-");
      const hash = encode(await digest(secret));
      const row = await Database.use((tx) =>
        tx
          .insert(KeyTable)
          .values({
            id: Identifier.create("key"),
            userID: input.userID,
            name: input.name,
            key: hash,
            meta: { display: mask(secret) },
            expiresAt: input.expiresAt ?? null,
          })
          .returning()
          .then((rows) => rows[0]!),
      );
      return { ...serialize(row), key: secret };
    },
  );

  /**
   * Resolves a secret to its user. `api` keys only. The hash is what's indexed, so this is a
   * single lookup and the database never compares the secret itself.
   */
  export const verify = fn(z.string(), async (secret) => {
    const hash = encode(await digest(secret));
    const row = await Database.use((tx) =>
      tx
        .select({ id: KeyTable.id, userID: KeyTable.userID, used: KeyTable.timeUsed })
        .from(KeyTable)
        .where(
          and(
            eq(KeyTable.key, hash),
            eq(KeyTable.type, "api"),
            isNull(KeyTable.timeDeleted),
            live(),
          ),
        )
        .then((rows) => rows.at(0)),
    );
    if (!row) return null;

    // Stamps last use at most hourly, so a busy key isn't a write per request — and concurrent
    // requests holding it aren't all queued behind the same row.
    if (!row.used || Date.now() - row.used.getTime() >= TOUCH)
      await Database.use((tx) =>
        tx.update(KeyTable).set({ timeUsed: new Date() }).where(eq(KeyTable.id, row.id)),
      );

    return row.userID;
  });

  /** Every live key the user has. Pass the caller's secret to flag its key `current`. */
  export const list = fn(
    z.string().optional(),
    async (current) => {
      const hash = current ? encode(await digest(current)) : null;
      return Database.use((tx) =>
        tx
          .select()
          .from(KeyTable)
          .where(
            and(
              eq(KeyTable.userID, Actor.userID()),
              eq(KeyTable.type, "api"),
              isNull(KeyTable.timeDeleted),
              live(),
            ),
          )
          .orderBy(desc(KeyTable.timeCreated))
          .then((rows) => rows.map((row) => serialize(row, hash))),
      );
    },
    {
      title: "List keys",
      description:
        "List the current user's API keys. Secrets are stored hashed, so `key` is null here — only `create` ever returns one. The key authenticating this request is flagged `current`.",
    },
  );

  /** Revokes an API key — the secret stops authenticating immediately. */
  export const remove = fn(
    Info.shape.id,
    async (id) =>
      found(
        "Key",
        await Database.use((tx) =>
          tx
            .update(KeyTable)
            .set({ timeDeleted: new Date() })
            .where(
              and(
                eq(KeyTable.id, id),
                eq(KeyTable.type, "api"),
                eq(KeyTable.userID, Actor.userID()),
                isNull(KeyTable.timeDeleted),
              ),
            )
            .returning({ id: KeyTable.id })
            .then((rows) => rows.at(0)),
        ),
      ),
    {
      title: "Revoke key",
      description: "Revoke an API key. The secret stops authenticating immediately.",
    },
  );

  function serialize(row: typeof KeyTable.$inferSelect, hash?: string | null): Info {
    return {
      id: row.id,
      name: row.name,
      // Parsed: a row written before a key kept a mask has nothing under it.
      display: Meta.parse(row.meta).display,
      key: null,
      timeUsed: iso(row.timeUsed),
      expiresAt: iso(row.expiresAt),
      current: !!hash && row.key === hash,
    };
  }

  // === UTILS ===

  /** Unexpired: no expiry set, or expiry still in the future. */
  function live() {
    return or(isNull(KeyTable.expiresAt), gt(KeyTable.expiresAt, new Date()));
  }

  /** What's left of a secret once the row keeps only its hash: recognisable, not usable. */
  function mask(secret: string) {
    return `${secret.slice(0, 7)}...${secret.slice(-4)}`;
  }
}
