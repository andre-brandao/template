import { z } from "zod";
import { and, count, eq, isNull, sql } from "drizzle-orm";
import { fn } from "../../util/fn";
import { Context } from "../../context";
import { Database } from "../../drizzle";
import { Central } from "../../drizzle/central";
import { Migrations } from "../../drizzle/migrate";
import { ErrorCodes, VisibleError } from "../../error";
import { Identifier } from "../../identifier";
import { Identity } from "../../identity";
import { Queue } from "../../lib/queue";
import { UserTable } from "../../user/user.central";
import { Workspace } from "../../workspace";
import { MemberTable } from "./member.sql";
import { AccessTable, WorkspaceTable } from "./workspace.central";

/**
 * The registry: which workspaces exist and who can see each. Plural so it reads apart from
 * the kernel `Workspace`, which is only the one a request runs in.
 */
export namespace Workspaces {
  export type Row = typeof WorkspaceTable.$inferSelect;

  export const Info = z
    .object({
      id: z
        .string()
        .meta({ description: "Workspace id.", example: "wsp_01JZ8Q4N2V7T5X3M9K6R1B0C2D" }),
      slug: z.string().meta({ description: "URL handle, unique.", example: "acme" }),
      name: z.string().meta({ description: "Display name.", example: "Acme" }),
      status: z
        .enum(["pending", "ready"])
        .meta({ description: "`pending` until its schema is migrated; only `ready` opens." }),
      timeCreated: z.iso.datetime().meta({ description: "When it was created." }),
    })
    .meta({ ref: "Workspace", description: "A tenant with its own schema." });
  export type Info = z.infer<typeof Info>;

  /**
   * Which client a workspace's tables live on; `undefined` is the shared pool. An app with a
   * database per workspace provides one that maps the row to its client.
   */
  export const connect = Context.port<(row: Row) => Database.Client | undefined>(
    () => () => undefined,
  );

  /** Migrates the schema, seats the owner, then opens it. Idempotent, so a retry is safe. */
  export const job = Queue.define(
    "workspace.setup",
    z.object({ id: z.string(), owner: z.string().optional() }),
    async (input) => {
      const row = await Central.use((tx) =>
        tx
          .select()
          .from(WorkspaceTable)
          .where(eq(WorkspaceTable.id, input.id))
          .then((rows) => rows.at(0)),
      );
      if (!row) throw new Error(`No workspace ${input.id}`);
      const user = input.owner;
      const owner = user
        ? await Central.use((tx) =>
            tx
              .select({ userID: UserTable.id, name: UserTable.name, email: UserTable.email })
              .from(UserTable)
              .where(eq(UserTable.id, user))
              .then((rows) => rows.at(0)),
          )
        : undefined;
      await inside(row, { schema: row.schema }, async () => {
        await Migrations.tenant(row.schema);
        if (owner)
          await Database.use((tx) =>
            tx
              .insert(MemberTable)
              .values({ ...owner, role: "owner" })
              .onConflictDoNothing(),
          );
      });
      await Central.use((tx) =>
        tx.update(WorkspaceTable).set({ status: "ready" }).where(eq(WorkspaceTable.id, row.id)),
      );
    },
  );

  /**
   * Registers the row as `pending` and queues `job` to build it. Central is written first; with
   * separate databases the tenant half is not in that transaction, which the idempotent job covers.
   */
  export const create = fn(
    z.object({
      slug: z
        .string()
        .regex(/^[a-z0-9_]{1,40}$/)
        .meta({
          description: "URL handle: lowercase letters, digits and underscores.",
          example: "acme",
        }),
      name: z.string().min(1).max(120).meta({ description: "Display name.", example: "Acme" }),
    }),
    async (input) => {
      if (Workspace.mode() === "single") throw single();
      const id = Identifier.create("workspace");
      const schema = Workspace.valid(`ws_${input.slug}`);
      const owner = Identity.peek() && Identity.known() ? Identity.userID() : undefined;
      await Central.transaction(async (tx) => {
        await tx.insert(WorkspaceTable).values({ id, slug: input.slug, name: input.name, schema });
        if (owner) await tx.insert(AccessTable).values({ userID: owner, workspaceID: id });
      });
      // Outside the transaction: the `sync` driver runs the job inline, which opens the workspace.
      await job.push({ id, owner });
      return { id, schema };
    },
  );

  /** The current user's workspaces, read off central access alone. */
  export const list = fn(z.void(), () =>
    Central.use((tx) =>
      tx
        .select({ row: WorkspaceTable })
        .from(AccessTable)
        .innerJoin(WorkspaceTable, eq(WorkspaceTable.id, AccessTable.workspaceID))
        .where(and(eq(AccessTable.userID, Identity.userID()), isNull(WorkspaceTable.timeDeleted)))
        .then((rows) => rows.map((item) => serialize(item.row))),
    ),
  );

  /**
   * The request's workspace with the caller's role, or `undefined` in multi mode before one is
   * picked. Single mode has no setup job, so the first read seats its row and the caller.
   */
  export const current = fn(z.void(), async () => {
    const row = await here();
    if (!row) return;
    const role = Workspace.mode() === "single" ? await join(row) : Workspace.peek()?.role;
    return { ...serialize(row), role };
  });

  /** Renames a workspace; the slug moves only in multi mode, the schema never does. */
  export const update = fn(
    z.object({
      id: Info.shape.id,
      name: z.string().min(1).max(120).meta({ description: "Display name.", example: "Acme" }),
      slug: z
        .string()
        .regex(/^[a-z0-9_]{1,40}$/)
        .optional()
        .meta({ description: "New URL handle, multi mode only.", example: "acme" }),
    }),
    async (input) => {
      const row = await Central.use((tx) =>
        tx
          .select()
          .from(WorkspaceTable)
          .where(and(eq(WorkspaceTable.id, input.id), isNull(WorkspaceTable.timeDeleted)))
          .then((rows) => rows.at(0)),
      );
      if (!row) throw forbidden();
      await manage(row);
      const slug = input.slug ?? row.slug;
      if (slug !== row.slug && Workspace.mode() === "single") throw single();
      if (slug !== row.slug) {
        const taken = await Central.use((tx) =>
          tx
            .select({ id: WorkspaceTable.id })
            .from(WorkspaceTable)
            .where(eq(WorkspaceTable.slug, slug))
            .then((rows) => rows.length > 0),
        );
        if (taken)
          throw new VisibleError(
            "validation",
            ErrorCodes.Validation.INVALID_PARAMETER,
            "That slug is taken",
            "slug",
          );
      }
      const next = await Central.use((tx) =>
        tx
          .update(WorkspaceTable)
          .set({ name: input.name, slug, timeUpdated: new Date() })
          .where(eq(WorkspaceTable.id, row.id))
          .returning(),
      );
      return serialize(next[0] ?? row);
    },
  );

  /** The request workspace's people, from its own `member` table. */
  export const members = fn(z.void(), async () => {
    if (!(await current())) throw forbidden();
    return roster();
  });

  /** Changes a member's role. Owners and admins only, and the last owner stays one. */
  export const role = fn(
    z.object({
      userID: z
        .string()
        .meta({ description: "The member.", example: "usr_01JZ8Q4N2V7T5X3M9K6R1B0C2D" }),
      role: z.enum(Workspace.roles).meta({ description: "Their new role.", example: "admin" }),
    }),
    async (input) => {
      const row = await here();
      if (!row) throw forbidden();
      await manage(row);
      if (input.userID === Identity.userID())
        throw new VisibleError(
          "forbidden",
          ErrorCodes.Permission.FORBIDDEN,
          "You can't change your own role",
        );
      await Database.transaction(async (tx) => {
        const owners = await tx
          .select({ userID: MemberTable.userID })
          .from(MemberTable)
          .where(and(eq(MemberTable.role, "owner"), isNull(MemberTable.timeDeleted)));
        if (input.role !== "owner" && owners.length === 1 && owners[0]?.userID === input.userID)
          throw new VisibleError(
            "conflict",
            ErrorCodes.Conflict.LAST_OWNER,
            "A workspace needs at least one owner",
          );
        const done = await tx
          .update(MemberTable)
          .set({ role: input.role, timeUpdated: new Date() })
          .where(and(eq(MemberTable.userID, input.userID), isNull(MemberTable.timeDeleted)))
          .returning({ userID: MemberTable.userID });
        if (!done.length)
          throw new VisibleError(
            "not_found",
            ErrorCodes.NotFound.RESOURCE_NOT_FOUND,
            "Not a member of this workspace",
          );
      });
    },
  );

  /** Every workspace for the back office, member counts read off central access in one query. */
  export const registry = fn(z.void(), async () => {
    Identity.check({ admin: ["read"] });
    if (Workspace.mode() === "single") await fallback();
    return Central.use((tx) =>
      tx
        .select({
          row: WorkspaceTable,
          members: tx.$count(AccessTable, eq(AccessTable.workspaceID, WorkspaceTable.id)),
        })
        .from(WorkspaceTable)
        .where(isNull(WorkspaceTable.timeDeleted))
        .orderBy(WorkspaceTable.slug)
        .then((rows) =>
          rows.map((item) => ({
            ...serialize(item.row),
            schema: item.row.schema,
            members: item.members,
          })),
        ),
    );
  });

  /** One workspace opened up for an operator: who can see it and its members. */
  export const inspect = fn(z.object({ slug: Info.shape.slug }), async (input) => {
    Identity.check({ admin: ["read"] });
    const row = await find(input.slug);
    const access = await Central.use((tx) =>
      tx
        .select({
          userID: AccessTable.userID,
          name: UserTable.name,
          email: UserTable.email,
          timeCreated: AccessTable.timeCreated,
        })
        .from(AccessTable)
        .innerJoin(UserTable, eq(UserTable.id, AccessTable.userID))
        .where(eq(AccessTable.workspaceID, row.id))
        .orderBy(AccessTable.timeCreated)
        .then((rows) =>
          rows.map((one) => ({ ...one, timeCreated: one.timeCreated.toISOString() })),
        ),
    );
    // A pending schema may not exist yet. Disk use is `usage`, which reads the catalogs in one go.
    const open = row.status === "ready";
    const members = open ? await inside(row, { schema: row.schema }, roster) : [];
    return {
      workspace: { ...serialize(row), schema: row.schema },
      access,
      members,
    };
  });

  /** Queues the setup job again for a workspace stuck `pending`; the job is idempotent. */
  export const retry = fn(z.object({ slug: Info.shape.slug }), async (input) => {
    Identity.check({ admin: ["read"] });
    const row = await find(input.slug);
    if (row.status !== "pending")
      throw new VisibleError(
        "conflict",
        ErrorCodes.Validation.INVALID_STATE,
        "Workspace is already set up",
      );
    // The first to get access is who `create` seated as owner.
    const owner = await Central.use((tx) =>
      tx
        .select({ userID: AccessTable.userID })
        .from(AccessTable)
        .where(eq(AccessTable.workspaceID, row.id))
        .orderBy(AccessTable.timeCreated)
        .limit(1)
        .then((rows) => rows.at(0)?.userID),
    );
    await job.push({ id: row.id, owner });
  });

  /**
   * Disk use per workspace schema, plus `central` for comparison, from the catalogs in one
   * query. `slug` narrows it to that workspace. With a database per workspace this would run
   * once per client `connect` picks; here every schema shares the one pool.
   */
  export const usage = fn(z.object({ slug: Info.shape.slug.optional() }), async (input) => {
    Identity.check({ admin: ["read"] });
    const only = input.slug ? (await find(input.slug)).schema : undefined;
    const rows = await Central.use((tx) =>
      tx.execute<{
        schema: string;
        name: string;
        rows: string;
        data: string;
        indexes: string;
        total: string;
      }>(
        sql`
            SELECT n.nspname AS schema,
                   c.relname AS name,
                   -- reltuples is -1 until the first analyze; the live count covers that gap.
                   coalesce(s.n_live_tup, greatest(c.reltuples, 0))::bigint AS rows,
                   pg_relation_size(c.oid) AS data,
                   pg_indexes_size(c.oid) AS indexes,
                   pg_total_relation_size(c.oid) AS total
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
            WHERE c.relkind IN ('r', 'p')
              AND ${
                only
                  ? sql`n.nspname = ${only}`
                  : sql`(n.nspname = 'central' OR n.nspname IN (
                      SELECT ${WorkspaceTable.schema} FROM ${WorkspaceTable}
                      WHERE ${WorkspaceTable.timeDeleted} IS NULL))`
              }
            ORDER BY pg_total_relation_size(c.oid) DESC
          `,
        "objects",
      ),
    );
    // Postgres hands bigints back as strings; group the one result per schema.
    const tables = [...rows].map((row) => ({
      schema: row.schema,
      name: row.name,
      rows: Number(row.rows),
      data: Number(row.data),
      indexes: Number(row.indexes),
      total: Number(row.total),
    }));
    return [...new Set(tables.map((one) => one.schema))].map((schema) => {
      const own = tables.filter((one) => one.schema === schema);
      return {
        schema,
        bytes: own.reduce((sum, one) => sum + one.total, 0),
        tables: own.length,
        rows: own.reduce((sum, one) => sum + one.rows, 0),
        breakdown: own,
      };
    });
  });

  /** Every workspace, for operators (the CLI); no identity needed, so never route it. */
  export function all() {
    return Central.use((tx) =>
      tx
        .select({
          slug: WorkspaceTable.slug,
          name: WorkspaceTable.name,
          schema: WorkspaceTable.schema,
          status: WorkspaceTable.status,
        })
        .from(WorkspaceTable)
        .where(isNull(WorkspaceTable.timeDeleted))
        .orderBy(WorkspaceTable.slug),
    );
  }

  /** What a request runs in, which is also the switch check. Single mode has only the one. */
  export async function resolve(slug: string) {
    if (Workspace.mode() === "single") throw single();
    return (await locate(slug)).info;
  }

  /**
   * Runs `fn` in the request's workspace — the one surfaces call. Single mode ignores `slug`;
   * multi mode needs a slug and a known caller, else `fn` runs with none.
   */
  export async function enter<R>(slug: string | undefined, fn: () => Promise<R>) {
    if (Workspace.mode() === "single") return Workspace.provide(Workspace.single(), fn);
    if (!slug || !Identity.peek() || !Identity.known()) return fn();
    const found = await locate(slug);
    return inside(found.row, found.info, fn);
  }

  export function serialize(row: Row): Info {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      status: row.status,
      timeCreated: row.timeCreated.toISOString(),
    };
  }

  // === UTILS ===

  // Unknown slugs and outsiders both get a 403, so slugs don't leak.
  async function locate(slug: string) {
    const user = Identity.userID();
    const row = await Central.use((tx) =>
      tx
        .select({ row: WorkspaceTable })
        .from(WorkspaceTable)
        .innerJoin(
          AccessTable,
          and(eq(AccessTable.workspaceID, WorkspaceTable.id), eq(AccessTable.userID, user)),
        )
        .where(and(eq(WorkspaceTable.slug, slug), isNull(WorkspaceTable.timeDeleted)))
        .then((rows) => rows.at(0)?.row),
    );
    if (!row) throw forbidden();
    if (row.status !== "ready")
      throw new VisibleError(
        "conflict",
        ErrorCodes.Conflict.NOT_READY,
        "Workspace is still being set up",
      );
    const member = await inside(row, { schema: row.schema }, () =>
      Database.use((tx) =>
        tx
          .select({ role: MemberTable.role })
          .from(MemberTable)
          .where(and(eq(MemberTable.userID, user), isNull(MemberTable.timeDeleted)))
          .then((rows) => rows.at(0)),
      ),
    );
    if (!member) throw forbidden();
    return { row, info: { schema: row.schema, role: member.role } satisfies Workspace.Info };
  }

  function forbidden() {
    return new VisibleError(
      "forbidden",
      ErrorCodes.Permission.FORBIDDEN,
      "Not a member of this workspace",
    );
  }

  /** `fn` in `info`'s schema, on the client `connect` picks for the row. */
  function inside<R>(row: Row, info: Workspace.Info, fn: () => R): R {
    const client = connect.use()(row);
    const run = () => Workspace.provide(info, fn);
    return client ? Database.provide(client, run) : run();
  }

  function single() {
    return new VisibleError(
      "conflict",
      ErrorCodes.Conflict.SINGLE_WORKSPACE,
      "This app runs a single workspace: it can't create or switch workspaces",
    );
  }

  /** Throws unless the caller is the workspace's owner or admin, or a platform admin. */
  async function manage(row: Row) {
    if (Identity.can({ admin: ["read"] })) return;
    const user = Identity.userID();
    const member = await inside(row, { schema: row.schema }, () =>
      Database.use((tx) =>
        tx
          .select({ role: MemberTable.role })
          .from(MemberTable)
          .where(and(eq(MemberTable.userID, user), isNull(MemberTable.timeDeleted)))
          .then((rows) => rows.at(0)),
      ),
    );
    if (member?.role === "owner" || member?.role === "admin") return;
    throw new VisibleError(
      "forbidden",
      ErrorCodes.Permission.INSUFFICIENT_PERMISSIONS,
      "Only a workspace owner or admin can change it",
    );
  }

  /** The request workspace's row: single mode's default, or the one `enter` provided. */
  async function here() {
    if (Workspace.mode() === "single") return fallback();
    const info = Workspace.peek();
    if (!info) return;
    return Central.use((tx) =>
      tx
        .select()
        .from(WorkspaceTable)
        .where(and(eq(WorkspaceTable.schema, info.schema), isNull(WorkspaceTable.timeDeleted)))
        .then((rows) => rows.at(0)),
    );
  }

  // Single mode never runs `create`, so its registry row is seated on first read.
  async function fallback() {
    const schema = Workspace.single().schema;
    await Central.use((tx) =>
      tx
        .insert(WorkspaceTable)
        .values({
          id: Identifier.create("workspace"),
          slug: "default",
          name: "Workspace",
          schema,
          status: "ready",
        })
        .onConflictDoNothing(),
    );
    const row = await Central.use((tx) =>
      tx
        .select()
        .from(WorkspaceTable)
        .where(eq(WorkspaceTable.schema, schema))
        .then((rows) => rows.at(0)),
    );
    if (!row) throw new Error(`Slug "default" is taken by a schema other than ${schema}`);
    return row;
  }

  // Single mode has no setup job to seat anyone: the first to arrive owns it, the rest join
  // as members. Returns the caller's role, or nothing for a caller with no account.
  async function join(row: Row) {
    if (!Identity.peek() || !Identity.known()) return;
    const user = Identity.userID();
    const person = await Central.use((tx) =>
      tx
        .select({ userID: UserTable.id, name: UserTable.name, email: UserTable.email })
        .from(UserTable)
        .where(eq(UserTable.id, user))
        .then((rows) => rows.at(0)),
    );
    if (!person) return;
    await Central.use((tx) =>
      tx.insert(AccessTable).values({ userID: user, workspaceID: row.id }).onConflictDoNothing(),
    );
    return inside(row, { schema: row.schema }, () =>
      Database.transaction(async (tx) => {
        const found = await tx
          .select({ role: MemberTable.role })
          .from(MemberTable)
          .where(eq(MemberTable.userID, user))
          .then((rows) => rows.at(0));
        if (found) return found.role;
        const empty = await tx
          .select({ n: count() })
          .from(MemberTable)
          .then((rows) => (rows[0]?.n ?? 0) === 0);
        const role: Workspace.Role = empty ? "owner" : "member";
        await tx
          .insert(MemberTable)
          .values({ ...person, role })
          .onConflictDoNothing();
        return role;
      }),
    );
  }

  /** The members of whichever schema is provided. */
  function roster() {
    return Database.use((tx) =>
      tx
        .select({
          userID: MemberTable.userID,
          name: MemberTable.name,
          email: MemberTable.email,
          role: MemberTable.role,
          timeCreated: MemberTable.timeCreated,
        })
        .from(MemberTable)
        .where(isNull(MemberTable.timeDeleted))
        .orderBy(MemberTable.timeCreated)
        .then((rows) =>
          rows.map((one) => ({ ...one, timeCreated: one.timeCreated.toISOString() })),
        ),
    );
  }

  // For operators only, so a missing slug can say so.
  async function find(slug: string) {
    const row = await Central.use((tx) =>
      tx
        .select()
        .from(WorkspaceTable)
        .where(and(eq(WorkspaceTable.slug, slug), isNull(WorkspaceTable.timeDeleted)))
        .then((rows) => rows.at(0)),
    );
    if (!row)
      throw new VisibleError(
        "not_found",
        ErrorCodes.NotFound.RESOURCE_NOT_FOUND,
        "No such workspace",
      );
    return row;
  }
}
