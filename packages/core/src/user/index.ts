import { z } from "zod";
import { and, asc, count, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { fn } from "../util/fn";
import { Database } from "../drizzle";
import { Actor } from "../actor";
import { Common } from "../common";
import { ErrorCodes, found, VisibleError } from "../error";
import { Event } from "../event";
import { Examples } from "../examples";
import { Identifier } from "../identifier";
import { Permission } from "../permission";
import { UserTable } from "./user.sql";
import { order } from "../drizzle/order";
import { Patch } from "./prefs";
import { ProviderIds, ProviderTable } from "./provider.sql";

export namespace User {
  export const Info = z
    .object({
      id: z.string().meta({ description: Common.IdDescription, example: Examples.User.id }),
      name: z.string().min(1),
      email: z.string().email(),
      emailVerified: z.boolean().optional(),
      image: z.string().nullable(),
      // Read-only through `update`, which picks its fields explicitly. `assign` is the
      // only way to change one, and it wants `user: ["assign"]`.
      role: z.enum(Permission.roles),
    })
    .meta({
      ref: "User",
      description: "A user account.",
      example: Examples.User,
    });
  export type Info = z.infer<typeof Info>;

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
        .where(eq(ProviderTable.userID, Actor.userID()));

      return ProviderIds.map((id) => {
        const row = rows.find((row) => row.providerId === id);
        return {
          id,
          accountId: row?.accountId ?? null,
          connected: Boolean(row),
          timeCreated: row?.timeCreated.toISOString() ?? null,
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
    }),
    async (input) => {
      const id = Identifier.create("user");
      await Database.use((tx) =>
        tx.insert(UserTable).values({
          id,
          name: input.name,
          email: input.email,
          emailVerified: input.emailVerified ?? false,
          image: input.image ?? null,
        }),
      );
      return id;
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
        .then((rows) => rows.at(0) ?? null),
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

  export const fromEmail = fn(Info.shape.email, (email) =>
    Database.use((tx) =>
      tx
        .select()
        .from(UserTable)
        .where(eq(UserTable.email, email))
        .then((rows) => rows.at(0) ?? null),
    ),
  );

  export const update = fn(
    z.object({ name: Info.shape.name.optional(), image: Info.shape.image.optional() }),
    (input) =>
      Database.use((tx) =>
        tx
          .update(UserTable)
          .set({ ...input, timeUpdated: new Date() })
          .where(eq(UserTable.id, Actor.userID())),
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
        .where(eq(UserTable.id, Actor.userID())),
    ),
  );

  /** The admin view of a user: the public shape plus whether the account is disabled. */
  export const Row = Info.extend({ timeDeleted: z.iso.datetime().nullable() });
  export type Row = z.infer<typeof Row>;

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
    const actor = Actor.use();
    if (actor.type === "user" && actor.properties.userID === id)
      throw new VisibleError(
        "validation",
        ErrorCodes.Validation.INVALID_STATE,
        "You cannot change your own account here",
      );
  }

  /** Admin directory: paginated, carries the role, can surface disabled accounts. */
  export const page = fn(
    Common.Query(["name", "email", "role", "timeCreated"]).extend({
      search: z.string().optional(),
      /** Include disabled accounts, which are hidden by default like every other soft delete. */
      deleted: z.boolean().optional(),
    }),
    (input) => {
      Actor.check({ admin: ["read"] });
      const { page, pageSize, limit, offset } = Common.page(input);
      const where = and(
        input.deleted ? undefined : isNull(UserTable.timeDeleted),
        input.search
          ? or(
              ilike(UserTable.name, `%${input.search}%`),
              ilike(UserTable.email, `%${input.search}%`),
            )
          : undefined,
      );
      return Database.use(async (tx) => {
        const [rows, totalRows] = await Promise.all([
          tx
            .select()
            .from(UserTable)
            .where(where)
            .orderBy(...order(UserTable, input.sort, asc(UserTable.name)))
            .limit(limit)
            .offset(offset),
          tx.select({ total: count() }).from(UserTable).where(where),
        ] as const);
        return {
          data: rows.map(
            (row): Row => ({
              id: row.id,
              name: row.name,
              email: row.email,
              emailVerified: row.emailVerified,
              image: row.image,
              role: row.role,
              timeDeleted: row.timeDeleted?.toISOString() ?? null,
            }),
          ),
          page,
          pageSize,
          total: totalRows[0]?.total ?? 0,
        };
      });
    },
  );

  export const assign = fn(
    z.object({ id: Info.shape.id, role: Info.shape.role }),
    async (input) => {
      Actor.check({ user: ["assign"] });
      other(input.id);
      const before = found("User", await target(input.id));
      if (before.role === input.role) return;

      return Database.transaction(async (tx) => {
        await tx
          .update(UserTable)
          .set({ role: input.role, timeUpdated: new Date() })
          .where(eq(UserTable.id, input.id));
        await Event.create({
          type: "user.assigned",
          source: "user",
          sourceID: input.id,
          data: { from: before.role, to: input.role },
        });
      });
    },
  );

  /** Disables an account. Their rows stay put — one `restore` away, nothing orphaned. */
  export const remove = fn(Info.shape.id, async (id) => {
    Actor.check({ user: ["delete"] });
    other(id);
    const before = found("User", await target(id));
    if (before.timeDeleted) return;

    return Database.transaction(async (tx) => {
      await tx.update(UserTable).set({ timeDeleted: new Date() }).where(eq(UserTable.id, id));
      await Event.create({
        type: "user.removed",
        source: "user",
        sourceID: id,
        data: { email: before.email },
      });
    });
  });

  export const restore = fn(Info.shape.id, async (id) => {
    Actor.check({ user: ["delete"] });
    const before = found("User", await target(id));
    if (!before.timeDeleted) return;

    return Database.transaction(async (tx) => {
      await tx
        .update(UserTable)
        .set({ timeDeleted: null, timeUpdated: new Date() })
        .where(eq(UserTable.id, id));
      await Event.create({
        type: "user.restored",
        source: "user",
        sourceID: id,
        data: { email: before.email },
      });
    });
  });
}
