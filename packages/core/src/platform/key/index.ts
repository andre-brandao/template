import { z } from "zod";
import { and, desc, eq, isNull } from "drizzle-orm";
import { fn } from "../../util/fn";
import { iso } from "../../util/fmt";
import { Assert } from "../../util/assert";
import { Identity } from "../../identity";
import { Common } from "../../common";
import { Central } from "../../drizzle/central";
import { Examples } from "../../examples";
import { Identifier } from "../../identifier";
import { digest, encode } from "../../util/hash";
import { token } from "../../util/token";
import { KeyTable, TOUCH, live } from "./key.central";

export namespace Key {
  const assert = Assert.create("Key");

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
      description:
        "A personal access token (or an App's API key). It acts as the user that owns it.",
      example: Examples.Key,
    });
  export type Info = z.infer<typeof Info>;

  /** What an `api` key's row remembers, now that the secret itself isn't kept. */
  const Meta = z.object({ display: z.string().default("") });

  /** A number of days from now as an expiry instant. No days means a key that never expires. */
  export function expires(days?: number) {
    return days ? new Date(Date.now() + days * 86_400_000) : null;
  }

  /** Unchecked: for setup and `App.key`, whose caller has checked it may mint for `userID`. */
  export const mint = fn(
    z.object({
      userID: Identifier.schema("user"),
      name: Info.shape.name,
      expiresAt: z.date().nullable().optional(),
    }),
    async (input) => {
      const secret = token("sk-");
      const hash = encode(await digest(secret));
      const row = await Central.use((tx) =>
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

  /** Mints a key for the caller. The only moment the secret exists: the row keeps a hash. */
  export const create = fn(mint.schema.omit({ userID: true }), (input) => {
    Identity.check({ key: ["create"] });
    return mint({ ...input, userID: Identity.userID() });
  });

  /** Resolves a secret to its user, `api` keys only. The hash is indexed: a single lookup. */
  export const verify = fn(z.string(), async (secret) => {
    const hash = encode(await digest(secret));
    const row = await Central.use((tx) =>
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

    // Stamps last use at most hourly, so a busy key isn't a write per request.
    if (!row.used || Date.now() - row.used.getTime() >= TOUCH)
      await Central.use((tx) =>
        tx.update(KeyTable).set({ timeUsed: new Date() }).where(eq(KeyTable.id, row.id)),
      );

    return row.userID ? { id: row.id, userID: row.userID } : null;
  });

  /** The caller's live keys; the one authenticating this request is flagged `current`. */
  export const list = fn(
    z.void(),
    async () => {
      const user = Identity.userID();
      Identity.check({ key: ["read"] }, user);
      const info = Identity.use();
      const current = "credential" in info.properties ? info.properties.credential : undefined;
      return (await rows(user)).map((row) => serialize(row, current));
    },
    {
      title: "List personal access tokens",
      description:
        "List the current user's personal access tokens. Secrets are stored hashed, so `key` is null here — only `create` ever returns one. The key authenticating this request is flagged `current`.",
    },
  );

  /** Someone else's live keys — an App's. Unchecked: the caller checks it may manage them. */
  export const owned = fn(Identifier.schema("user"), async (user) =>
    (await rows(user)).map((row) => serialize(row)),
  );

  /** Revokes one of `user`'s keys. Unchecked, like `owned`. */
  export const revoke = fn(z.object({ id: Info.shape.id, user: z.string() }), (input) =>
    drop(input.id, input.user),
  );

  /** Revokes a personal access token — the secret stops authenticating immediately. */
  export const remove = fn(
    Info.shape.id,
    (id) => {
      const user = Identity.userID();
      Identity.check({ key: ["delete"] }, user);
      return drop(id, user);
    },
    {
      title: "Revoke personal access token",
      description:
        "Revoke one of your personal access tokens. The secret stops authenticating immediately.",
    },
  );

  function serialize(row: typeof KeyTable.$inferSelect, current?: string): Info {
    return {
      id: row.id,
      name: row.name,
      // Parsed: a row written before a key kept a mask has nothing under it.
      display: Meta.parse(row.meta).display,
      key: null,
      timeUsed: iso(row.timeUsed),
      expiresAt: iso(row.expiresAt),
      current: row.id === current,
    };
  }

  // === UTILS ===

  function rows(user: string) {
    return Central.use((tx) =>
      tx
        .select()
        .from(KeyTable)
        .where(
          and(
            eq(KeyTable.userID, user),
            eq(KeyTable.type, "api"),
            isNull(KeyTable.timeDeleted),
            live(),
          ),
        )
        .orderBy(desc(KeyTable.timeCreated)),
    );
  }

  function drop(id: string, user: string) {
    return assert.exists(
      Central.use((tx) =>
        tx
          .update(KeyTable)
          .set({ timeDeleted: new Date() })
          .where(
            and(
              eq(KeyTable.id, id),
              eq(KeyTable.type, "api"),
              eq(KeyTable.userID, user),
              isNull(KeyTable.timeDeleted),
            ),
          )
          .returning({ id: KeyTable.id })
          .then((rows) => rows.at(0)),
      ),
    );
  }

  /** What's left of a secret once the row keeps only its hash: recognisable, not usable. */
  function mask(secret: string) {
    return `${secret.slice(0, 7)}...${secret.slice(-4)}`;
  }
}
