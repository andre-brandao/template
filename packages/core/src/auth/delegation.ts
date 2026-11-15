import { z } from "zod";
import { and, eq, gt, isNull, lt } from "drizzle-orm";
import { fn } from "../util/fn";
import { Database } from "../drizzle";
import { ErrorCodes, VisibleError } from "../error";
import { Identity } from "../identity";
import { Identifier } from "../identifier";
import { Permission } from "../permission";
import { digest, encode } from "../util/hash";
import { token } from "../util/token";
import { KeyTable } from "../platform/key/key.sql";

/**
 * A person lending their authority to an agent: an `agt-` bearer that resolves to an `agent`
 * identity, not to them. Short-lived, held hashed in the `key` table under `type: "agent"`.
 */
export namespace Delegation {
  /** An hour: long enough for one agent run, short enough that a leaked one dies on its own. */
  const TTL = 60 * 60 * 1000;

  const Meta = z.object({
    scope: z.custom<Permission.Grants>((v) => typeof v === "object" && v !== null).optional(),
  });

  /** Mints a delegation from the current identity to `name`. The raw token exists only here. */
  export const create = fn(
    z.object({
      name: z.string().min(1).max(255),
      scope: Meta.shape.scope,
    }),
    async (input) => {
      const user = Identity.userID();
      const info = Identity.use();
      // The same narrowing `Identity.delegate` enforces, for a token that outlives the call.
      if (info.type === "system")
        throw new VisibleError(
          "forbidden",
          ErrorCodes.Permission.FORBIDDEN,
          "An App can't delegate",
        );
      const held = info.type === "agent" ? info.properties.scope : undefined;
      if (held && input.scope && !Permission.within(held, input.scope))
        throw new VisibleError(
          "forbidden",
          ErrorCodes.Permission.INSUFFICIENT_PERMISSIONS,
          `${input.name} can't hold more than the identity lending to it`,
        );
      const scope = input.scope ?? held;
      const secret = token("agt-");
      await Database.transaction(async (tx) => {
        // Expired delegations are never read again, so minting a new one sweeps them.
        await tx
          .delete(KeyTable)
          .where(
            and(
              eq(KeyTable.userID, user),
              eq(KeyTable.type, "agent"),
              lt(KeyTable.expiresAt, new Date()),
            ),
          );
        await tx.insert(KeyTable).values({
          id: Identifier.create("key"),
          userID: user,
          name: input.name,
          key: encode(await digest(secret)),
          type: "agent",
          meta: { scope },
          expiresAt: new Date(Date.now() + TTL),
        });
      });
      return secret;
    },
  );

  /** Who lent what to whom, or null when the token is unknown or expired. */
  export const verify = fn(z.string(), async (secret) => {
    const hash = encode(await digest(secret));
    const row = await Database.use((tx) =>
      tx
        .select({
          id: KeyTable.id,
          userID: KeyTable.userID,
          name: KeyTable.name,
          meta: KeyTable.meta,
        })
        .from(KeyTable)
        .where(
          and(
            eq(KeyTable.key, hash),
            eq(KeyTable.type, "agent"),
            isNull(KeyTable.timeDeleted),
            gt(KeyTable.expiresAt, new Date()),
          ),
        )
        .then((rows) => rows.at(0)),
    );
    if (!row?.userID) return null;
    return { id: row.id, userID: row.userID, name: row.name, scope: Meta.parse(row.meta).scope };
  });
}
