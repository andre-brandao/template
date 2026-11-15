import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { fn } from "../../util/fn";
import { iso } from "../../util/fmt";
import { Database } from "../../drizzle";
import { Identity } from "../../identity";
import { Identifier } from "../../identifier";
import { ConnectionTable } from "./connection.sql";

/**
 * External integrations, held per user. The app runs its own OAuth "connect" flow with its own
 * client and scopes, then hands the tokenset here; the identity issuer is never involved, so a
 * shared issuer can't leak one app's grants to another.
 */
export namespace Connection {
  const provider = z.string().min(1).max(64);

  export const Info = z.object({
    provider,
    accountId: z.string().nullable(),
    scopes: z.array(z.string()),
    expiresAt: z.iso.datetime().nullable(),
    timeCreated: z.iso.datetime(),
  });
  export type Info = z.infer<typeof Info>;

  /** Connects, or replaces the grant on reconnect — one connection per user and provider. */
  export const save = fn(
    z.object({
      provider,
      accountId: z.string().optional(),
      scopes: z.array(z.string()).optional(),
      access: z.string().min(1),
      refresh: z.string().nullable().optional(),
      expiresAt: z.date().nullable().optional(),
    }),
    async (input) => {
      const tokens = {
        accountId: input.accountId ?? null,
        scopes: input.scopes ?? [],
        accessToken: input.access,
        refreshToken: input.refresh ?? null,
        tokenExpiresAt: input.expiresAt ?? null,
      };
      await Database.use((tx) =>
        tx
          .insert(ConnectionTable)
          .values({
            id: Identifier.create("connection"),
            userID: Identity.userID(),
            provider: input.provider,
            ...tokens,
          })
          .onConflictDoUpdate({
            target: [ConnectionTable.userID, ConnectionTable.provider],
            set: { ...tokens, timeUpdated: new Date() },
          }),
      );
    },
  );

  /** The current user's connections, secrets left out. */
  export const list = fn(z.void(), () =>
    Database.use((tx) =>
      tx
        .select()
        .from(ConnectionTable)
        .where(eq(ConnectionTable.userID, Identity.userID()))
        .then((rows) => rows.map(serialize)),
    ),
  );

  /** Raw tokens for `provider`, or null if not connected. Server-only; never route this. */
  export const tokens = fn(provider, (name) =>
    Database.use((tx) =>
      tx
        .select({
          access: ConnectionTable.accessToken,
          refresh: ConnectionTable.refreshToken,
          expiresAt: ConnectionTable.tokenExpiresAt,
        })
        .from(ConnectionTable)
        .where(
          and(eq(ConnectionTable.userID, Identity.userID()), eq(ConnectionTable.provider, name)),
        )
        .then((rows) => rows.at(0) ?? null),
    ),
  );

  /** Disconnects. Revoking at the provider is the integration's to do first. */
  export const remove = fn(provider, (name) =>
    Database.use((tx) =>
      tx
        .delete(ConnectionTable)
        .where(
          and(eq(ConnectionTable.userID, Identity.userID()), eq(ConnectionTable.provider, name)),
        ),
    ),
  );

  function serialize(row: typeof ConnectionTable.$inferSelect): Info {
    return {
      provider: row.provider,
      accountId: row.accountId,
      scopes: row.scopes,
      expiresAt: iso(row.tokenExpiresAt),
      timeCreated: row.timeCreated.toISOString(),
    };
  }
}
