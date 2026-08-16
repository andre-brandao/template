import { z } from "zod";
import { and, desc, eq, gt, isNull, or } from "drizzle-orm";
import { fn } from "../../util/fn";
import { Database } from "../../drizzle";
import { Identifier } from "../../identifier";
import { memo } from "../../util/memo";
import { token } from "../../util/token";
import { KeyTable } from "./key.sql";

/**
 * The secret behind a signed URL. Shares the `key` table with API keys but is a different
 * thing: no owner, and it never authenticates a request — `Key.verify` resolves `api` alone.
 */
export namespace Signing {
  /** Minted on first use, cached per process. A racing first mint just leaves two usable keys. */
  export const current = memo(async () => {
    const row = await Database.use((tx) =>
      tx
        .select()
        .from(KeyTable)
        .where(and(eq(KeyTable.type, "signing"), isNull(KeyTable.timeDeleted), live()))
        .orderBy(desc(KeyTable.timeCreated))
        .limit(1)
        .then((rows) => rows.at(0)),
    );
    if (row) return { id: row.id, secret: row.key };

    const made = await Database.use((tx) =>
      tx
        .insert(KeyTable)
        .values({
          id: Identifier.create("key"),
          userID: null,
          name: "url-signing",
          key: token("sk-"),
          type: "signing",
        })
        .returning()
        .then((rows) => rows[0]!),
    );
    return { id: made.id, secret: made.key };
  });

  /** The verifying half: the secret behind a key id, for a route checking a URL. */
  export const secret = fn(z.string(), (id) =>
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

  /** Unexpired: no expiry set, or expiry still in the future. */
  function live() {
    return or(isNull(KeyTable.expiresAt), gt(KeyTable.expiresAt, new Date()));
  }
}
