import { z } from "zod";
import { and, asc, eq, ilike, isNull, sql, type SQLWrapper } from "drizzle-orm";
import { Assert } from "../util/assert";
import { fn } from "../util/fn";
import { iso } from "../util/fmt";
import { Database } from "../drizzle";
import { Identity } from "../identity";
import { Common } from "../common";
import { ErrorCodes, VisibleError } from "../error";
import { Bus } from "../platform/bus";
import { Examples } from "../examples";
import { Identifier } from "../identifier";
import { Permission } from "../permission";
import { sortable } from "../drizzle/order";
import { UserTable } from "./user.sql";
import { Patch, Prefs } from "./prefs";
import { ProviderIds, ProviderTable } from "../auth/provider.sql";

export namespace User {
  export const assert = Assert.create("User");

  export const Info = z
    .object({
      id: z.string().meta({ description: Common.IdDescription, example: Examples.User.id }),
      name: z.string().min(1).meta({ description: "Display name." }),
      email: z.string().email().meta({ description: "Login address. Unique across accounts." }),
      emailVerified: z
        .boolean()
        .optional()
        .meta({ description: "Whether the address has been confirmed." }),
      image: z.string().nullable().meta({ description: "Avatar URL, or null for none." }),
      // Read-only through `update`, which picks its fields explicitly. `assign` is the
      // only way to change one, and it wants `user: ["assign"]`.
      role: z.enum(Permission.roles).meta({
        description: "Decides everything the account may do. Only `user:assign` can change it.",
      }),
      kind: z.enum(["human", "system"]).meta({
        description:
          "A `system` account is an App: nobody logs in as it — an external system or CI acting through API keys.",
      }),
      ownerID: z
        .string()
        .nullable()
        .meta({ description: "For an App, the person answerable for it. Null for people." }),
      prefs: Prefs.meta({
        description: "Display preferences. Every key has a default, so this is always complete.",
      }),
      timeDeleted: z.iso
        .datetime()
        .nullable()
        .meta({ description: "When the account was disabled. Null while it is active." }),
      timeCreated: z.iso.datetime().meta({ description: "When the account was created." }),
    })
    .meta({
      ref: "User",
      description: "A user account.",
      example: Examples.User,
    });
  export type Info = z.infer<typeof Info>;

  export const Event = {
    Assigned: Bus.define("user.assigned", z.object({ from: Info.shape.role, to: Info.shape.role })),
    // Recorded as whoever made the account: the `auth` agent on signup, an admin for an App.
    Created: Bus.define("user.created", Info.pick({ email: true, kind: true })),
    // A new way into an existing account — Google added to one made by emailed code.
    Linked: Bus.define("user.linked", z.object({ provider: z.string() })),
    Removed: Bus.define("user.removed", Info.pick({ email: true })),
    Restored: Bus.define("user.restored", Info.pick({ email: true })),
  };

  /** Sortable keys mapped to what each orders by — also the allowlist. */
  export const SortableColumns = sortable(
    {
      name: UserTable.name,
      email: UserTable.email,
      role: UserTable.role,
      timeCreated: UserTable.timeCreated,
    } satisfies Partial<Record<keyof Info, SQLWrapper>>,
    UserTable.id,
    asc(UserTable.name),
  );

  /** A login provider, connected or not. Not in the HTTP API — the dashboard reads core directly. */
  export const Provider = z.object({
    id: z.enum(ProviderIds),
    /** The identity held at the provider — an email, or its own user id. Null when not connected. */
    accountId: z.string().nullable(),
    connected: z.boolean(),
    timeCreated: z.iso.datetime().nullable(),
  });
  export type Provider = z.infer<typeof Provider>;

  /** Every provider with its connection state, so the profile can offer the unconnected ones. */
  export const providers = fn(z.void(), () =>
    Database.use(async (tx) => {
      const rows = await tx
        .select({
          providerId: ProviderTable.providerId,
          accountId: ProviderTable.accountId,
          timeCreated: ProviderTable.timeCreated,
        })
        .from(ProviderTable)
        .where(eq(ProviderTable.userID, Identity.userID()));

      return ProviderIds.map((id) => {
        const row = rows.find((row) => row.providerId === id);
        return {
          id,
          accountId: row?.accountId ?? null,
          connected: Boolean(row),
          timeCreated: iso(row?.timeCreated),
        };
      });
    }),
  );

  export const create = fn(
    z.object({
      name: Info.shape.name,
      email: Info.shape.email,
      emailVerified: Info.shape.emailVerified,
      image: Info.shape.image.optional(),
      kind: Info.shape.kind.optional(),
      ownerID: z.string().optional(),
    }),
    // A grant, not an open door: signup holds it through the `auth` agent, an App through its admin.
    async (input) => {
      Identity.check({ user: ["create"] });
      const user = await Database.use((tx) =>
        tx
          .insert(UserTable)
          .values({
            id: Identifier.create("user"),
            name: input.name,
            email: input.email,
            emailVerified: input.emailVerified ?? false,
            image: input.image ?? null,
            kind: input.kind ?? "human",
            ownerID: input.ownerID ?? null,
          })
          .returning()
          .then((rows) => serialize(rows[0]!)),
      );
      await Event.Created.publish({ email: user.email, kind: user.kind }, { subject: user.id });
      return user;
    },
  );

  /**
   * Disabled accounts are invisible here, which is what locks them out — every auth path
   * resolves its actor through this. Admin screens query directly to restore them.
   */
  export const fromID = fn(Info.shape.id, (id) =>
    Database.use((tx) =>
      tx
        .select()
        .from(UserTable)
        .where(and(eq(UserTable.id, id), isNull(UserTable.timeDeleted)))
        .then((rows) => (rows[0] ? serialize(rows[0]) : null)),
    ),
  );

  /** Directory behind assignee pickers. Not in the HTTP API — the dashboard reads core directly. */
  export const list = fn(z.object({ search: z.string().optional() }).optional(), (input) =>
    Database.use((tx) =>
      tx
        .select({
          id: UserTable.id,
          name: UserTable.name,
          email: UserTable.email,
          image: UserTable.image,
        })
        .from(UserTable)
        .where(input?.search ? ilike(UserTable.name, `%${input.search}%`) : undefined)
        .orderBy(asc(UserTable.name))
        .limit(100),
    ),
  );

  /**
   * Another account as a teammate sees it: no prefs, and no address for an App — its email is a
   * placeholder. Any signed-in reader holds `user:read`, the same grant the assignee picker uses.
   */
  export const Profile = Info.pick({
    id: true,
    name: true,
    image: true,
    kind: true,
    role: true,
    timeCreated: true,
  })
    .extend({
      email: Info.shape.email.nullable(),
      owner: z.object({ id: z.string(), name: z.string() }).nullable(),
    })
    .meta({ ref: "Profile", description: "An account as other signed-in users see it." });
  export type Profile = z.infer<typeof Profile>;

  export const profile = fn(
    Info.shape.id,
    async (id): Promise<Profile | null> => {
      Identity.check({ user: ["read"] });
      const row = await fromID(id);
      if (!row) return null;
      const owner = row.ownerID ? await fromID(row.ownerID) : null;
      return {
        id: row.id,
        name: row.name,
        image: row.image,
        kind: row.kind,
        role: row.role,
        timeCreated: row.timeCreated,
        email: row.kind === "system" ? null : row.email,
        owner: owner ? { id: owner.id, name: owner.name } : null,
      };
    },
    {
      title: "Get profile",
      description: "Fetch an account as a teammate sees it: no prefs, and no email for an App.",
    },
  );

  export const fromEmail = fn(Info.shape.email, (email) =>
    Database.use((tx) =>
      tx
        .select()
        .from(UserTable)
        .where(eq(UserTable.email, email))
        .then((rows) => (rows[0] ? serialize(rows[0]) : null)),
    ),
  );

  export const update = fn(
    z.object({ name: Info.shape.name.optional(), image: Info.shape.image.optional() }),
    (input) =>
      Database.use((tx) =>
        tx
          .update(UserTable)
          .set({ ...input, timeUpdated: new Date() })
          .where(eq(UserTable.id, Identity.userID())),
      ),
  );

  /** Patch-merges prefs with a jsonb `||` in one statement — no read-modify-write race. */
  export const prefs = fn(Patch, (input) =>
    Database.use((tx) =>
      tx
        .update(UserTable)
        .set({
          prefs: sql`${UserTable.prefs} || ${JSON.stringify(input)}::jsonb`,
          timeUpdated: new Date(),
        })
        .where(eq(UserTable.id, Identity.userID())),
    ),
  );

  /** Reads past the disabled filter `fromID` applies — the admin screens act on those rows. */
  const target = (id: string) =>
    Database.use((tx) =>
      tx
        .select()
        .from(UserTable)
        .where(eq(UserTable.id, id))
        .then((rows) => rows.at(0) ?? null),
    );

  /** Both ways an admin could lock themselves out: demoting or disabling their own account. */
  function other(id: string) {
    if (Identity.known() && Identity.userID() === id)
      throw new VisibleError(
        "validation",
        ErrorCodes.Validation.INVALID_STATE,
        "You cannot change your own account here",
      );
  }

  export const assign = fn(
    z.object({ id: Info.shape.id, role: Info.shape.role }),
    async (input) => {
      Identity.check({ user: ["assign"] });
      other(input.id);
      const before = await assert.exists(target(input.id));
      if (before.role === input.role) return;

      return Database.transaction(async (tx) => {
        await tx
          .update(UserTable)
          .set({ role: input.role, timeUpdated: new Date() })
          .where(eq(UserTable.id, input.id));
        await Event.Assigned.publish({ from: before.role, to: input.role }, { subject: input.id });
      });
    },
  );

  /** Disables an account. Their rows stay put — one `restore` away, nothing orphaned. */
  export const remove = fn(Info.shape.id, async (id) => {
    Identity.check({ user: ["delete"] });
    other(id);
    const before = await assert.exists(target(id));
    if (before.timeDeleted) return;

    return Database.transaction(async (tx) => {
      await tx.update(UserTable).set({ timeDeleted: new Date() }).where(eq(UserTable.id, id));
      await Event.Removed.publish({ email: before.email }, { subject: id });
    });
  });

  export const restore = fn(Info.shape.id, async (id) => {
    Identity.check({ user: ["delete"] });
    const before = await assert.exists(target(id));
    if (!before.timeDeleted) return;

    return Database.transaction(async (tx) => {
      await tx
        .update(UserTable)
        .set({ timeDeleted: null, timeUpdated: new Date() })
        .where(eq(UserTable.id, id));
      await Event.Restored.publish({ email: before.email }, { subject: id });
    });
  });

  export function serialize(row: typeof UserTable.$inferSelect): Info {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      emailVerified: row.emailVerified,
      image: row.image,
      role: row.role,
      kind: row.kind,
      ownerID: row.ownerID,
      // Parsed, not passed through: a row written before a preference existed is missing
      // that key, and the column's `$type` would claim otherwise.
      prefs: Prefs.parse(row.prefs),
      timeDeleted: iso(row.timeDeleted),
      timeCreated: row.timeCreated.toISOString(),
    };
  }
}
