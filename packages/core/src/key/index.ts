import { z } from "zod";
import { and, desc, eq, gt, isNull, or } from "drizzle-orm";
import { fn } from "../util/fn";
import { found } from "../error";
import { Actor } from "../actor";
import { Common } from "../common";
import { Database } from "../drizzle";
import { Examples } from "../examples";
import { Identifier } from "../identifier";
import { memo } from "../util/memo";
import { KeyTable } from "./key.sql";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export namespace Key {
  export const Info = z
    .object({
      id: z.string().meta({ description: Common.IdDescription, example: Examples.Key.id }),
      name: z.string().min(1).max(255),
      key: z.string().meta({ description: "The secret. Handed back in full so it can be copied." }),
      display: z.string().meta({ description: "Masked secret, safe to show in a list." }),
      timeUsed: z.iso
        .datetime()
        .nullable()
        .meta({ description: "When the key last authenticated a request." }),
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

  /** Takes `userID` so a key can be minted before an actor exists. Returns the raw secret. */
  export const create = fn(
    z.object({
      userID: Identifier.schema("user"),
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
            name: input.name,
            key: token(),
            expiresAt: input.expiresAt ?? null,
          })
          .returning()
          .then((rows) => serialize(rows[0]!)),
      ),
  );

  /** Resolves a secret to its user, stamping `time_used` in the same round-trip. `api` keys only. */
  export const verify = fn(z.string(), (key) =>
    Database.use((tx) =>
      tx
        .update(KeyTable)
        .set({ timeUsed: new Date() })
        .where(
          and(
            eq(KeyTable.key, key),
            eq(KeyTable.type, "api"),
            isNull(KeyTable.timeDeleted),
            live(),
          ),
        )
        .returning({ userID: KeyTable.userID })
        .then((rows) => rows.at(0)?.userID ?? null),
    ),
  );

  /**
   * URL-signing key, minted on first use and cached per process. No user row, so `list`
   * and `remove` can't reach it. A racing first mint just leaves two usable keys.
   */
  export const signing = memo(async () => {
    const existing = await Database.use((tx) =>
      tx
        .select()
        .from(KeyTable)
        .where(and(eq(KeyTable.type, "signing"), isNull(KeyTable.timeDeleted), live()))
        .orderBy(desc(KeyTable.timeCreated))
        .limit(1)
        .then((rows) => rows.at(0)),
    );
    if (existing) return { id: existing.id, secret: existing.key };

    const made = await Database.use((tx) =>
      tx
        .insert(KeyTable)
        .values({
          id: Identifier.create("key"),
          userID: null,
          name: "url-signing",
          key: token(),
          type: "signing",
        })
        .returning()
        .then((rows) => rows[0]!),
    );
    return { id: made.id, secret: made.key };
  });

  /** The secret behind a signing key id — the verifying half, for routes checking a URL. */
  export const secret = fn(Info.shape.id, (id) =>
    Database.use((tx) =>
      tx
        .select({ key: KeyTable.key })
        .from(KeyTable)
        .where(
          and(
            eq(KeyTable.id, id),
            eq(KeyTable.type, "signing"),
            isNull(KeyTable.timeDeleted),
            live(),
          ),
        )
        .then((rows) => rows.at(0)?.key ?? null),
    ),
  );

  /** Every live key the user has. Pass the caller's secret to flag its key `current`. */
  export const list = fn(z.string().optional(), (current) =>
    Database.use((tx) =>
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
        .then((rows) => rows.map((row) => serialize(row, current))),
    ),
  );

  /** Revokes an API key — the secret stops authenticating immediately. */
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

  /** Unexpired: no expiry set, or expiry still in the future. */
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
      name: row.name,
      key: row.key,
      display: `${row.key.slice(0, 7)}...${row.key.slice(-4)}`,
      timeUsed: row.timeUsed?.toISOString() ?? null,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      current: row.key === current,
    };
  }
}
