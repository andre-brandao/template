import { z } from "zod";
import { and, desc, eq, gt, isNull, or } from "drizzle-orm";
import { fn } from "../util/fn";
import { found, ErrorCodes, VisibleError } from "../error";
import { Actor } from "../actor";
import { Common } from "../common";
import { Database } from "../drizzle";
import { Examples } from "../examples";
import { Identifier } from "../identifier";
import { Member } from "../organization/member";
import { RoleTable } from "../organization/role.sql";
import { KeyTable } from "./key.sql";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export namespace Key {
  export const Info = z
    .object({
      id: z.string().meta({ description: Common.IdDescription, example: Examples.Key.id }),
      name: z.string().min(1).max(255),
      key: z.string().meta({ description: "The secret. Handed back in full so it can be copied." }),
      display: z.string().meta({ description: "Masked secret, safe to show in a list." }),
      role: z
        .object({ id: z.string(), name: z.string() })
        .meta({ description: "The role the key acts with — it caps the key's permissions." }),
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
      description: "An API key belonging to a user, scoped to a role in an organization.",
      example: Examples.Key,
    });
  export type Info = z.infer<typeof Info>;

  /**
   * Takes `userID` rather than reading the actor, so callers with an explicit
   * `roleID` can mint a key before an actor exists. Without `roleID` the key
   * takes the user's own role in the org in scope — never a guessed org. Naming
   * another role requires its permissions to be covered by the user's own — a
   * key can never out-rank its owner. Returns the raw secret.
   */
  export const create = fn(
    z.object({
      userID: Identifier.schema("user"),
      name: Info.shape.name,
      expiresAt: z.date().nullable().optional(),
      roleID: z.string().optional(),
    }),
    async (input) => {
      const wanted = input.roleID;
      const role = wanted
        ? found(
            "Role",
            await Database.use((tx) =>
              tx
                .select({
                  id: RoleTable.id,
                  orgID: RoleTable.orgID,
                  permissions: RoleTable.permissions,
                })
                .from(RoleTable)
                .where(eq(RoleTable.id, wanted))
                .then((rows) => rows.at(0)),
            ),
          )
        : null;
      const org = role?.orgID ?? Actor.orgID();
      const membership = await Member.resolve({ userID: input.userID, orgID: org });
      if (membership?.orgID !== org)
        throw new VisibleError(
          "forbidden",
          ErrorCodes.Permission.FORBIDDEN,
          "Not a member of the role's organization",
        );
      if (role && !covers(membership.permissions, role.permissions))
        throw new VisibleError(
          "forbidden",
          ErrorCodes.Permission.INSUFFICIENT_PERMISSIONS,
          "The key's role exceeds your own permissions",
        );

      const id = Identifier.create("key");
      await Database.use((tx) =>
        tx.insert(KeyTable).values({
          id,
          userID: input.userID,
          roleID: role?.id ?? membership.roleID,
          name: input.name,
          key: token(),
          expiresAt: input.expiresAt ?? null,
        }),
      );
      return found(
        "Key",
        await Database.use((tx) =>
          rows(tx)
            .where(eq(KeyTable.id, id))
            .then((r) => r.map((row) => serialize(row)).at(0)),
        ),
      );
    },
  );

  /**
   * Resolves a secret to its actor, stamping `time_used`. The key acts as the
   * user in the role's org, with the key role's permissions intersected with the
   * user's current membership — demotion caps old keys, and leaving the org
   * (or losing the membership) kills them.
   */
  export const verify = fn(z.string(), async (key) => {
    const hit = await Database.use((tx) =>
      tx
        .update(KeyTable)
        .set({ timeUsed: new Date() })
        .where(and(eq(KeyTable.key, key), isNull(KeyTable.timeDeleted), live()))
        .returning({ userID: KeyTable.userID, roleID: KeyTable.roleID })
        .then((rows) => rows.at(0)),
    );
    if (!hit) return null;

    const granted = await Database.use((tx) =>
      tx
        .select({ orgID: RoleTable.orgID, permissions: RoleTable.permissions })
        .from(RoleTable)
        .where(eq(RoleTable.id, hit.roleID))
        .then((rows) => rows.at(0)),
    );
    if (!granted) return null;

    const membership = await Member.resolve({ userID: hit.userID, orgID: granted.orgID });
    if (membership?.orgID !== granted.orgID) return null;

    return {
      userID: hit.userID,
      orgID: granted.orgID,
      permissions: intersect(granted.permissions, membership.permissions),
    };
  });

  /**
   * Every live key the user has in the active org. Pass the caller's own secret
   * to have its key flagged `current`.
   */
  export const list = fn(z.string().optional(), (current) =>
    Database.use((tx) =>
      rows(tx)
        .where(
          and(
            eq(KeyTable.userID, Actor.userID()),
            eq(RoleTable.orgID, Actor.orgID()),
            isNull(KeyTable.timeDeleted),
            live(),
          ),
        )
        .orderBy(desc(KeyTable.timeCreated))
        .then((result) => result.map((row) => serialize(row, current))),
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

  function rows(tx: Database.TxOrDb) {
    return tx
      .select({ key: KeyTable, role: { id: RoleTable.id, name: RoleTable.name } })
      .from(KeyTable)
      .innerJoin(RoleTable, eq(RoleTable.id, KeyTable.roleID));
  }

  /** `a` covers `b`: every permission in `b` is one `a` could grant. */
  function covers(a: string[], b: string[]) {
    if (a.includes("*")) return true;
    return b.every((perm) => perm !== "*" && a.includes(perm));
  }

  function intersect(granted: string[], current: string[]) {
    if (granted.includes("*")) return current;
    if (current.includes("*")) return granted;
    return granted.filter((perm) => current.includes(perm));
  }

  function token() {
    const bytes = new Uint32Array(64);
    crypto.getRandomValues(bytes);
    return "sk-" + Array.from(bytes, (n) => CHARS[n % CHARS.length]!).join("");
  }

  function serialize(
    row: { key: typeof KeyTable.$inferSelect; role: { id: string; name: string } },
    current?: string,
  ): Info {
    return {
      id: row.key.id,
      name: row.key.name,
      key: row.key.key,
      display: `${row.key.key.slice(0, 7)}...${row.key.key.slice(-4)}`,
      role: row.role,
      timeUsed: row.key.timeUsed?.toISOString() ?? null,
      expiresAt: row.key.expiresAt?.toISOString() ?? null,
      current: row.key.key === current,
    };
  }
}
