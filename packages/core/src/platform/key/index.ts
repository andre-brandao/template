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
import { token } from "../../util/token";
import { KeyTable } from "./key.sql";

export namespace Key {
  export const Info = z
    .object({
      id: z.string().meta({ description: Common.IdDescription, example: Examples.Key.id }),
      name: z.string().min(1).max(255).meta({ description: "Label shown in the key list." }),
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
            key: token("sk-"),
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

  function serialize(row: typeof KeyTable.$inferSelect, current?: string): Info {
    return {
      id: row.id,
      name: row.name,
      key: row.key,
      display: `${row.key.slice(0, 7)}...${row.key.slice(-4)}`,
      timeUsed: iso(row.timeUsed),
      expiresAt: iso(row.expiresAt),
      current: row.key === current,
    };
  }
}
