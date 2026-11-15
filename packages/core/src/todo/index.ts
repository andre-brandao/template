import { z } from "zod";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  ilike,
  isNotNull,
  isNull,
  max,
  min,
  ne,
  sql,
  type SQLWrapper,
} from "drizzle-orm";
import { Assert } from "../util/assert";
import { ErrorCodes, VisibleError } from "../error";
import { fn } from "../util/fn";
import { Database } from "../drizzle";
import { Actor } from "../actor";
import { Common } from "../common";
import { Examples } from "../examples";
import { Identifier } from "../identifier";
import { sortable } from "../drizzle/order";
import { date, iso, trim } from "../util/fmt";
import { clean, Tags } from "../util/tag";
import {
  Annotate,
  Link,
  Links,
  Metadata,
  annotate as merge,
  link as append,
  relink,
  unlink as detach,
} from "../util/meta";
import { Bus } from "../platform/bus";
import { UserTable } from "../user/user.sql";
import { rank, StatusValues, TodoTable } from "./todo.sql";

export { Insights } from "./insights";

export namespace Todo {
  export const assert = Assert.create("Todo");

  export const Status = z.enum(StatusValues);
  export type Status = z.infer<typeof Status>;

  /** Joined in — every list row wants the name, and a left join is cheap. */
  export const Assignee = z
    .object({
      id: z.string(),
      name: z.string(),
      image: z.string().nullable(),
    })
    .nullable()
    .meta({
      description: "The user responsible, joined in. Null when unassigned.",
    });
  export type Assignee = z.infer<typeof Assignee>;

  export const Info = z
    .object({
      id: z.string().meta({ description: Common.IdDescription, example: Examples.Todo.id }),
      createdBy: z.string().meta({ description: "Id of the user who created it." }),
      assignee: Assignee,
      source: z
        .string()
        .max(64)
        .nullable()
        .meta({ description: "Kind of entity that owns it, like `project`." }),
      sourceID: z
        .string()
        .nullable()
        .meta({ description: "Id of the owning entity, paired with `source`." }),
      parentID: z
        .string()
        .nullable()
        .meta({ description: "The todo this is a sub-issue of. Null at the top level." }),
      position: z.number().int().meta({ description: "Order among its siblings, from 0." }),
      stage: z
        .string()
        .max(64)
        .nullable()
        .meta({ description: "Pipeline stage, a free-text label. Null when unstaged." }),
      title: z.string().min(0).max(2000).meta({ description: "One-line summary." }),
      body: z.string().max(20000).nullable().meta({ description: "The long form, markdown." }),
      status: Status.meta({ description: "Where it sits in the pipeline." }),
      reason: z
        .string()
        .max(200)
        .nullable()
        .meta({ description: "Why it last moved status. The next transition clears it." }),
      tags: Tags.meta({ description: "Free-form labels, trimmed and deduplicated on write." }),
      startDate: z.iso.datetime().nullable().meta({ description: "When work is meant to start." }),
      dueDate: z.iso.datetime().nullable().meta({ description: "When it is meant to be done." }),
      timeStarted: z.iso
        .datetime()
        .nullable()
        .meta({ description: "When it first went `active`. Stamped once." }),
      timeDone: z.iso
        .datetime()
        .nullable()
        .meta({ description: "When it went `done`. Null while it is unfinished." }),
      metadata: Metadata,
      timeCreated: z.iso.datetime().meta({ description: "When it was created." }),
    })
    .meta({
      ref: "Todo",
      description: "A unit of work, owned by whatever entity created it.",
      example: Examples.Todo,
    });
  export type Info = z.infer<typeof Info>;

  export const Stage = z
    .object({
      name: z.string(),
      total: z.number(),
      done: z.number(),
      start: z.iso.datetime().nullable(),
      end: z.iso.datetime().nullable(),
    })
    .meta({
      ref: "Stage",
      description: "A stage label, with the span and counts derived from its todos.",
    });
  export type Stage = z.infer<typeof Stage>;

  const Patch = Info.pick({
    title: true,
    body: true,
    tags: true,
    stage: true,
    status: true,
    reason: true,
    startDate: true,
    dueDate: true,
  })
    // Written as an id, read back as the joined user.
    .extend({ assignee: z.string().nullable(), links: Links })
    .partial();
  type Patch = z.infer<typeof Patch>;

  /** Status and assignee moves stay internal; `Updated` is the public one and reports them too. */
  export const Event = {
    Created: Bus.define("todo.created", Info),
    Updated: Bus.define(
      "todo.updated",
      z.object({
        todo: Info,
        changes: z.record(z.string(), z.object({ before: z.unknown(), after: z.unknown() })),
      }),
    ),
    Removed: Bus.define("todo.removed", Info),
    Status: Bus.define(
      "todo.status",
      z.object({ from: Status, to: Status, reason: z.string().nullable() }),
    ),
    Assigned: Bus.define(
      "todo.assigned",
      z.object({ from: z.string().nullable(), to: z.string().nullable() }),
    ),
  };

  /** The assignee columns worth joining — never the whole user row. */
  const AssigneeColumns = { id: UserTable.id, name: UserTable.name, image: UserTable.image };

  /** Sortable keys mapped to what each orders by — also the allowlist. */
  export const SortableColumns = sortable(
    {
      title: TodoTable.title,
      status: rank,
      stage: TodoTable.stage,
      assignee: AssigneeColumns.name,
      startDate: TodoTable.startDate,
      dueDate: TodoTable.dueDate,
      timeCreated: TodoTable.timeCreated,
      position: TodoTable.position,
    } satisfies Partial<Record<keyof Info, SQLWrapper>>,
    TodoTable.id,
    desc(TodoTable.timeCreated),
  );

  export const create = fn(
    z.object({
      title: Info.shape.title,
      body: Info.shape.body.optional(),
      tags: Info.shape.tags.optional(),
      stage: Info.shape.stage.optional(),
      links: Links.optional(),
      assignee: Patch.shape.assignee,
      source: Info.shape.source.optional(),
      sourceID: Info.shape.sourceID.optional(),
      parentID: Info.shape.parentID.optional(),
      status: Status.optional(),
      startDate: Info.shape.startDate.optional(),
      dueDate: Info.shape.dueDate.optional(),
    }),
    async (input) => {
      Actor.check({ todo: ["create"] });
      const id = Identifier.create("todo");
      const tags = clean(input.tags);
      const status = input.status ?? "backlog";
      const stage = trim(input.stage);
      // A sub-issue lives with its parent's owner, whatever the caller passed.
      const parent = input.parentID ? await assert.exists(fromID.force(input.parentID)) : null;
      const owner = parent ?? {
        source: input.source ?? null,
        sourceID: input.sourceID ?? null,
      };
      return Database.transaction(async (tx) => {
        const [last] = await tx
          .select({ n: count() })
          .from(TodoTable)
          .where(siblings(parent?.id ?? null, owner));
        await tx.insert(TodoTable).values({
          id,
          createdBy: Actor.userID(),
          assignee: input.assignee ?? null,
          source: owner.source,
          sourceID: owner.sourceID,
          parentID: parent?.id ?? null,
          position: last?.n ?? 0,
          stage,
          title: input.title,
          body: input.body ?? null,
          status,
          tags,
          metadata: { annotations: {}, links: input.links ?? [] },
          startDate: date(input.startDate),
          dueDate: date(input.dueDate),
          ...times(status, null),
        });
        const todo = await assert.exists(fromID.force(id));
        await Event.Created.publish(todo, { subject: id, tags });
        return todo;
      });
    },
    {
      title: "Create todo",
      description:
        'Create a todo. Attach it to an entity with source/sourceID (e.g. source "project"), and give it a stage, assignee and planned dates to place it on the timeline. Pass parentID to make it a sub-issue; it joins the parent\'s owner, last among its siblings.',
    },
  );

  export const list = fn(
    Common.Query({
      sort: SortableColumns.schema,
      status: Status.optional(),
      assignee: z.string().optional().meta({ description: 'A user id, or "none" for unassigned.' }),
      stage: Info.shape.stage
        .unwrap()
        .optional()
        .meta({ description: 'A stage name, or "none" for todos without one.' }),
      source: Info.shape.source
        .unwrap()
        .optional()
        .meta({ description: 'The owning entity type, e.g. "project".' }),
      sourceID: Info.shape.sourceID.unwrap().optional(),
      createdBy: Info.shape.createdBy.optional(),
      parentID: z
        .string()
        .optional()
        .meta({ description: 'A todo id for its sub-issues, or "none" for top-level todos.' }),
      search: z.string().optional(),
    }),
    (input) => {
      Actor.check({ todo: ["read"] });
      const { page, pageSize, limit, offset } = Common.page(input);
      const conditions = [isNull(TodoTable.timeDeleted)];
      if (input.source) conditions.push(eq(TodoTable.source, input.source));
      if (input.sourceID) conditions.push(eq(TodoTable.sourceID, input.sourceID));
      if (input.status) conditions.push(eq(TodoTable.status, input.status));
      if (input.createdBy) conditions.push(eq(TodoTable.createdBy, input.createdBy));
      if (input.assignee)
        conditions.push(
          input.assignee === "none"
            ? isNull(TodoTable.assignee)
            : eq(TodoTable.assignee, input.assignee),
        );
      if (input.stage)
        conditions.push(
          input.stage === "none" ? isNull(TodoTable.stage) : eq(TodoTable.stage, input.stage),
        );
      if (input.parentID)
        conditions.push(
          input.parentID === "none"
            ? isNull(TodoTable.parentID)
            : eq(TodoTable.parentID, input.parentID),
        );
      if (input.search) conditions.push(ilike(TodoTable.title, `%${input.search}%`));
      const where = and(...conditions);
      return Database.use(async (tx) => {
        const [rows, totalRows] = await Promise.all([
          tx
            .select({ todo: TodoTable, user: AssigneeColumns })
            .from(TodoTable)
            .leftJoin(UserTable, eq(TodoTable.assignee, UserTable.id))
            .where(where)
            .orderBy(...SortableColumns.orderBy(input.sort))
            .limit(limit)
            .offset(offset),
          tx.select({ total: count() }).from(TodoTable).where(where),
        ] as const);
        return { data: rows.map(serialize), page, pageSize, total: totalRows[0]?.total ?? 0 };
      });
    },
    {
      title: "List todos",
      description:
        "List todos, optionally narrowed by status, assignee, stage, owning entity, parent or search. Paginated.",
    },
  );

  /** Stage list aggregated from the todos wearing each label — no second table to drift. */
  export const stages = fn(
    z.object({
      source: Info.shape.source.unwrap().optional(),
      sourceID: Info.shape.sourceID.unwrap().optional(),
    }),
    (input) => {
      Actor.check({ todo: ["read"] });
      return Database.use((tx) =>
        tx
          .select({
            name: TodoTable.stage,
            total: count(),
            done: sql<number>`cast(count(*) filter (where ${TodoTable.status} = 'done') as int)`,
            start: min(TodoTable.startDate),
            end: max(TodoTable.dueDate),
          })
          .from(TodoTable)
          .where(
            and(
              isNull(TodoTable.timeDeleted),
              input.source ? eq(TodoTable.source, input.source) : undefined,
              input.sourceID ? eq(TodoTable.sourceID, input.sourceID) : undefined,
              isNotNull(TodoTable.stage),
            ),
          )
          .groupBy(TodoTable.stage)
          .orderBy(sql`min(${TodoTable.startDate}) asc nulls last`, asc(TodoTable.stage))
          .then((rows) =>
            rows.map((row) => ({
              name: row.name ?? "",
              total: row.total,
              done: row.done,
              start: iso(row.start),
              end: iso(row.end),
            })),
          ),
      );
    },
    {
      title: "List stages",
      description:
        "The stage labels in use, with the span and counts derived from the todos in each. Call before staging a todo so labels stay consistent.",
    },
  );

  /** Renames a stage across every todo wearing it — the only stage edit there is. */
  export const rename = fn(
    z.object({
      from: Info.shape.stage.unwrap().min(1),
      to: Info.shape.stage.unwrap().min(1),
      source: Info.shape.source.unwrap().optional(),
      sourceID: Info.shape.sourceID.unwrap().optional(),
    }),
    (input) => {
      Actor.check({ todo: ["update"] });
      return Database.use((tx) =>
        tx
          .update(TodoTable)
          .set({ stage: input.to.trim(), timeUpdated: new Date() })
          .where(
            and(
              isNull(TodoTable.timeDeleted),
              input.source ? eq(TodoTable.source, input.source) : undefined,
              input.sourceID ? eq(TodoTable.sourceID, input.sourceID) : undefined,
              eq(TodoTable.stage, input.from),
            ),
          ),
      );
    },
    { title: "Rename stage", description: "Rename a stage across every todo wearing it." },
  );

  export const fromID = fn(
    Info.shape.id,
    (id) => {
      Actor.check({ todo: ["read"] });
      return Database.use((tx) =>
        tx
          .select({ todo: TodoTable, user: AssigneeColumns })
          .from(TodoTable)
          .leftJoin(UserTable, eq(TodoTable.assignee, UserTable.id))
          .where(and(eq(TodoTable.id, id), isNull(TodoTable.timeDeleted)))
          .then((rows) => (rows[0] ? serialize(rows[0]) : null)),
      );
    },
    { title: "Get todo", description: "Fetch a single todo by id." },
  );

  export const update = fn(
    Patch.extend({ id: Info.shape.id }),
    async ({ id, ...patch }) => {
      const before = await assert.exists(fromID.force(id));
      Actor.check({ todo: ["update"] }, before.createdBy);
      const next = {
        ...patch,
        ...(patch.tags !== undefined ? { tags: clean(patch.tags) } : {}),
        ...(patch.stage !== undefined ? { stage: trim(patch.stage) } : {}),
      };

      return Database.transaction(async (tx) => {
        await tx.update(TodoTable).set(fields(next, before)).where(eq(TodoTable.id, id));
        await emit(id, before, next);
      });
    },
    {
      title: "Update todo",
      description:
        "Update a todo's title, body, tags, stage, assignee, planned dates or status. Moving to `active` stamps the real start; `done` stamps the end.",
    },
  );

  export const move = fn(
    z.object({
      id: Info.shape.id,
      parentID: Info.shape.parentID,
      position: z
        .number()
        .int()
        .min(0)
        .optional()
        .meta({ description: "Slot among the new siblings, from 0. Last when omitted." }),
    }),
    async (input) => {
      const before = await assert.exists(fromID.force(input.id));
      Actor.check({ todo: ["update"] }, before.createdBy);
      if (input.parentID) await parent(input.parentID, before);

      return Database.transaction(async (tx) => {
        await close(tx, before);
        const ids = await tx
          .select({ id: TodoTable.id })
          .from(TodoTable)
          .where(and(siblings(input.parentID, before), ne(TodoTable.id, input.id)))
          .orderBy(asc(TodoTable.position))
          .then((rows) => rows.map((row) => row.id));
        ids.splice(Math.min(input.position ?? ids.length, ids.length), 0, input.id);
        for (const [position, id] of ids.entries())
          await tx
            .update(TodoTable)
            .set(
              id === input.id
                ? { parentID: input.parentID, position, timeUpdated: new Date() }
                : { position },
            )
            .where(eq(TodoTable.id, id));
        if (input.parentID === before.parentID) return;
        await Event.Updated.publish(
          {
            todo: await assert.exists(fromID.force(input.id)),
            changes: { parentID: { before: before.parentID, after: input.parentID } },
          },
          { subject: input.id, tags: before.tags },
        );
      });
    },
    {
      title: "Move todo",
      description:
        "Nest a todo under another (a sub-issue) or back to the top level with parentID null, at a position among its new siblings. The parent must share its owner and can't sit beneath it.",
    },
  );

  /** Adds a link, retitling one already at that url. One statement, so concurrent edits all land. */
  export const link = fn(
    Link.extend({ id: Info.shape.id }),
    async (input) => {
      const before = await assert.exists(fromID.force(input.id));
      Actor.check({ todo: ["update"] }, before.createdBy);
      const links = before.metadata.links;
      if (links.length >= 50 && !links.some((item) => item.url === input.url))
        throw new VisibleError(
          "validation",
          ErrorCodes.Validation.INVALID_PARAMETER,
          "A todo holds at most 50 links",
          "url",
        );
      await Database.use((tx) =>
        tx
          .update(TodoTable)
          .set({
            metadata: append(TodoTable.metadata, {
              url: input.url,
              title: input.title,
              type: input.type,
            }),
            timeUpdated: new Date(),
          })
          .where(eq(TodoTable.id, input.id)),
      );
      return assert.exists(fromID.force(input.id));
    },
    {
      title: "Link todo",
      description: "Attach an outside link to a todo, or retitle the one at that url.",
    },
  );

  export const unlink = fn(
    z.object({ id: Info.shape.id, url: z.string().meta({ description: "The link to drop." }) }),
    async (input) => {
      const before = await assert.exists(fromID.force(input.id));
      Actor.check({ todo: ["update"] }, before.createdBy);
      await Database.use((tx) =>
        tx
          .update(TodoTable)
          .set({ metadata: detach(TodoTable.metadata, input.url), timeUpdated: new Date() })
          .where(eq(TodoTable.id, input.id)),
      );
      return assert.exists(fromID.force(input.id));
    },
    { title: "Unlink todo", description: "Drop the link at a url from a todo." },
  );

  /** Annotations stay out of `update` and its events: a sync engine writing one isn't an edit. */
  export const annotate = fn(
    Annotate.extend({ id: Info.shape.id }),
    async (input) => {
      const before = await assert.exists(fromID.force(input.id));
      Actor.check({ todo: ["update"] }, before.createdBy);
      await Database.use((tx) =>
        tx
          .update(TodoTable)
          .set({ metadata: merge(TodoTable.metadata, input), timeUpdated: new Date() })
          .where(eq(TodoTable.id, input.id)),
      );
      return assert.exists(fromID.force(input.id));
    },
    {
      title: "Annotate todo",
      description:
        "Set or drop namespaced annotation keys on a todo. Keys under `github.com/` belong to the GitHub sync and are read-only.",
    },
  );

  /** Its sub-issues move up to take its place, so nothing goes missing with it. */
  export const remove = fn(
    Info.shape.id,
    async (id) => {
      const before = await assert.exists(fromID.force(id));
      Actor.check({ todo: ["delete"] }, before.createdBy);

      return Database.transaction(async (tx) => {
        await tx.update(TodoTable).set({ timeDeleted: new Date() }).where(eq(TodoTable.id, id));
        await close(tx, before);
        const [last] = await tx
          .select({ n: count() })
          .from(TodoTable)
          .where(siblings(before.parentID, before));
        const kids = await tx
          .select({ id: TodoTable.id })
          .from(TodoTable)
          .where(siblings(id, before))
          .orderBy(asc(TodoTable.position));
        for (const [at, kid] of kids.entries())
          await tx
            .update(TodoTable)
            .set({ parentID: before.parentID, position: (last?.n ?? 0) + at })
            .where(eq(TodoTable.id, kid.id));
        await Event.Removed.publish(before, { subject: id, tags: before.tags });
      });
    },
    {
      title: "Delete todo",
      description: "Soft-delete a todo. Its sub-issues move up to its parent.",
    },
  );

  function serialize(row: { todo: typeof TodoTable.$inferSelect; user: Assignee }): Info {
    return {
      id: row.todo.id,
      createdBy: row.todo.createdBy,
      assignee: row.user,
      source: row.todo.source,
      sourceID: row.todo.sourceID,
      parentID: row.todo.parentID,
      position: row.todo.position,
      stage: row.todo.stage,
      title: row.todo.title,
      body: row.todo.body,
      status: row.todo.status,
      reason: row.todo.reason,
      tags: row.todo.tags,
      startDate: iso(row.todo.startDate),
      dueDate: iso(row.todo.dueDate),
      timeStarted: iso(row.todo.timeStarted),
      timeDone: iso(row.todo.timeDone),
      metadata: row.todo.metadata,
      timeCreated: row.todo.timeCreated.toISOString(),
    };
  }

  // === UTILS ===

  type Owner = Pick<Info, "source" | "sourceID">;

  /** Live todos sharing a parent; top-level ones share the owner instead. */
  function siblings(parentID: string | null, owner: Owner) {
    if (parentID) return and(isNull(TodoTable.timeDeleted), eq(TodoTable.parentID, parentID));
    return and(
      isNull(TodoTable.timeDeleted),
      isNull(TodoTable.parentID),
      owner.source ? eq(TodoTable.source, owner.source) : isNull(TodoTable.source),
      owner.sourceID ? eq(TodoTable.sourceID, owner.sourceID) : isNull(TodoTable.sourceID),
    );
  }

  /** Shifts the later siblings down over the slot `todo` leaves. */
  function close(tx: Database.TxOrDb, todo: Info) {
    return tx
      .update(TodoTable)
      .set({ position: sql`${TodoTable.position} - 1` })
      .where(and(siblings(todo.parentID, todo), gt(TodoTable.position, todo.position)));
  }

  /** The chain from `id` up to the top, `id` first. */
  async function ancestors(id: string | null): Promise<string[]> {
    if (!id) return [];
    const [row] = await Database.use((tx) =>
      tx.select({ parent: TodoTable.parentID }).from(TodoTable).where(eq(TodoTable.id, id)),
    );
    return [id, ...(await ancestors(row?.parent ?? null))];
  }

  /** A parent must share the todo's owner and can't be the todo or sit beneath it. */
  async function parent(id: string, todo: Info) {
    const found = await assert.exists(fromID.force(id));
    const invalid = (message: string) =>
      new VisibleError("validation", ErrorCodes.Validation.INVALID_PARAMETER, message, "parentID");
    if (found.source !== todo.source || found.sourceID !== todo.sourceID)
      throw invalid("A sub-issue must belong to the same owner as its parent");
    if ((await ancestors(id)).includes(todo.id))
      throw invalid("A todo can't be nested under itself or its own sub-issues");
  }

  /**
   * Span moves with status: `active` stamps the start (once), `done` stamps the end,
   * falling back to backlog/planned clears both.
   */
  function times(status: Status, started: string | null) {
    const now = new Date();
    if (status === "active") return { timeStarted: date(started) ?? now, timeDone: null };
    if (status === "done") return { timeDone: now };
    if (status === "blocked") return { timeDone: null };
    return { timeStarted: null, timeDone: null };
  }

  /** The columns a patch copies through untouched. */
  function plain(patch: Patch) {
    return {
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.body !== undefined ? { body: patch.body } : {}),
      ...(patch.tags !== undefined ? { tags: patch.tags } : {}),
      ...(patch.links !== undefined ? { metadata: relink(TodoTable.metadata, patch.links) } : {}),
      ...(patch.stage !== undefined ? { stage: patch.stage } : {}),
      ...(patch.assignee !== undefined ? { assignee: patch.assignee } : {}),
      ...(patch.reason !== undefined ? { reason: patch.reason } : {}),
    };
  }

  function fields(patch: Patch, before: Info) {
    return {
      ...plain(patch),
      ...(patch.startDate !== undefined ? { startDate: date(patch.startDate) } : {}),
      ...(patch.dueDate !== undefined ? { dueDate: date(patch.dueDate) } : {}),
      // A transition drops the old reason unless this patch carries a new one.
      ...(patch.status !== undefined
        ? {
            status: patch.status,
            reason: patch.reason ?? null,
            ...times(patch.status, before.timeStarted),
          }
        : {}),
      timeUpdated: new Date(),
    };
  }

  /** The fields the activity log reports when they change. */
  const LOGGED = ["title", "body", "tags", "stage", "startDate", "dueDate"] as const;

  /** Tags compare by content; everything else by value. */
  function same(key: (typeof LOGGED)[number], before: Info, patch: Patch) {
    if (key === "tags") return patch.tags!.join(" ") === before.tags.join(" ");
    return patch[key] === before[key];
  }

  function diff(before: Info, patch: Patch) {
    const changed: Record<string, { before: unknown; after: unknown }> = {};
    for (const key of LOGGED) {
      if (patch[key] === undefined || same(key, before, patch)) continue;
      changed[key] = { before: before[key], after: patch[key] };
    }
    return changed;
  }

  async function moved(id: string, before: Info, next: Patch, tags: string[]) {
    if (next.status === undefined || next.status === before.status) return;
    await Event.Status.publish(
      { from: before.status, to: next.status, reason: next.reason ?? null },
      { subject: id, tags },
    );
  }

  async function assigned(id: string, before: Info, next: Patch, tags: string[]) {
    const prev = before.assignee?.id ?? null;
    if (next.assignee === undefined || next.assignee === prev) return;
    await Event.Assigned.publish({ from: prev, to: next.assignee }, { subject: id, tags });
  }

  /** Status and assignee moves, shaped like `diff` so the public update carries them too. */
  function moves(before: Info, next: Patch) {
    const prev = before.assignee?.id ?? null;
    return {
      ...(next.status !== undefined && next.status !== before.status
        ? { status: { before: before.status, after: next.status } }
        : {}),
      ...(next.assignee !== undefined && next.assignee !== prev
        ? { assignee: { before: prev, after: next.assignee } }
        : {}),
    };
  }

  /**
   * Emits the status/assignee/field events a patch implies. The status and assignee rows
   * stay internal; `todo.updated` is the one public event, so it reports those moves too.
   */
  async function emit(id: string, before: Info, next: Patch) {
    const tags = next.tags ?? before.tags;
    await moved(id, before, next, tags);
    await assigned(id, before, next, tags);

    const changed = { ...diff(before, next), ...moves(before, next) };
    if (!Object.keys(changed).length) return;
    await Event.Updated.publish(
      { todo: await assert.exists(fromID.force(id)), changes: changed },
      { subject: id, tags },
    );
  }
}
