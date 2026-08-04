import { z } from "zod";
import { and, asc, count, desc, eq, ilike, isNotNull, isNull, max, min, sql } from "drizzle-orm";
import { fn } from "../util/fn";
import { found } from "../error";
import { Database } from "../drizzle";
import { Actor } from "../actor";
import { Common } from "../common";
import { Examples } from "../examples";
import { Identifier } from "../identifier";
import { Event } from "../event";
import { UserTable } from "../user/user.sql";
import { StatusValues, TodoTable } from "./todo.sql";

export { Insights } from "./insights";

export namespace Todo {
  export const Status = z.enum(StatusValues);
  export type Status = z.infer<typeof Status>;

  const Tag = z.string().trim().min(1).max(64);

  /**
   * Joined in rather than looked up client-side: every list, card and timeline row wants
   * the name, and a left join costs nothing next to fetching the directory per page.
   */
  export const Assignee = z
    .object({ id: z.string(), name: z.string(), image: z.string().nullable() })
    .nullable();
  export type Assignee = z.infer<typeof Assignee>;

  export const Info = z
    .object({
      id: z.string().meta({ description: Common.IdDescription, example: Examples.Todo.id }),
      createdBy: z.string(),
      assignee: Assignee,
      source: z.string().max(64).nullable(),
      sourceID: z.string().nullable(),
      stage: z.string().max(64).nullable(),
      title: z.string().min(0).max(2000),
      body: z.string().max(20000).nullable(),
      status: Status,
      reason: z.string().max(200).nullable(),
      tags: Tag.array().max(20),
      startDate: z.iso.datetime().nullable(),
      dueDate: z.iso.datetime().nullable(),
      timeStarted: z.iso.datetime().nullable(),
      timeDone: z.iso.datetime().nullable(),
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

  function clean(tags?: string[]) {
    return [...new Set((tags ?? []).map((tag) => tag.trim()).filter(Boolean))];
  }

  const trim = (value?: string | null) => value?.trim() || null;

  const date = (value?: string | null) => (value ? new Date(value) : null);

  const iso = (value: Date | string | null) => (value ? new Date(value).toISOString() : null);

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
    .extend({ assignee: z.string().nullable() })
    .partial();
  type Patch = z.infer<typeof Patch>;

  /**
   * The actual span, moved by the status alone: entering `active` stamps the real start
   * (once — a blocked task that resumes keeps its original), `done` stamps the end, and
   * falling back to backlog/planned means it never really started after all.
   */
  function times(status: Status, started: string | null) {
    const now = new Date();
    if (status === "active") return { timeStarted: date(started) ?? now, timeDone: null };
    if (status === "done") return { timeDone: now };
    if (status === "blocked") return { timeDone: null };
    return { timeStarted: null, timeDone: null };
  }

  function fields(patch: Patch, before: Info) {
    return {
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.body !== undefined ? { body: patch.body } : {}),
      ...(patch.tags !== undefined ? { tags: patch.tags } : {}),
      ...(patch.stage !== undefined ? { stage: patch.stage } : {}),
      ...(patch.assignee !== undefined ? { assignee: patch.assignee } : {}),
      ...(patch.startDate !== undefined ? { startDate: date(patch.startDate) } : {}),
      ...(patch.dueDate !== undefined ? { dueDate: date(patch.dueDate) } : {}),
      ...(patch.reason !== undefined ? { reason: patch.reason } : {}),
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

  function diff(before: Info, patch: Patch) {
    const changed: Record<string, { before: unknown; after: unknown }> = {};
    if (patch.title !== undefined && patch.title !== before.title)
      changed.title = { before: before.title, after: patch.title };
    if (patch.body !== undefined && patch.body !== before.body)
      changed.body = { before: before.body, after: patch.body };
    if (patch.tags !== undefined && patch.tags.join(" ") !== before.tags.join(" "))
      changed.tags = { before: before.tags, after: patch.tags };
    if (patch.stage !== undefined && patch.stage !== before.stage)
      changed.stage = { before: before.stage, after: patch.stage };
    if (patch.startDate !== undefined && patch.startDate !== before.startDate)
      changed.startDate = { before: before.startDate, after: patch.startDate };
    if (patch.dueDate !== undefined && patch.dueDate !== before.dueDate)
      changed.dueDate = { before: before.dueDate, after: patch.dueDate };
    return changed;
  }

  /** The assignee columns worth joining — never the whole user row. */
  const assignee = { id: UserTable.id, name: UserTable.name, image: UserTable.image };

  /** Live rows, optionally narrowed to the entity that owns them. */
  function scope(input: { source?: string; sourceID?: string }) {
    const out = [isNull(TodoTable.timeDeleted)];
    if (input.source) out.push(eq(TodoTable.source, input.source));
    if (input.sourceID) out.push(eq(TodoTable.sourceID, input.sourceID));
    return out;
  }

  export const create = fn(
    z.object({
      title: Info.shape.title,
      body: Info.shape.body.optional(),
      tags: Info.shape.tags.optional(),
      stage: Info.shape.stage.optional(),
      assignee: z.string().nullable().optional(),
      source: Info.shape.source.optional(),
      sourceID: Info.shape.sourceID.optional(),
      status: Status.optional(),
      startDate: Info.shape.startDate.optional(),
      dueDate: Info.shape.dueDate.optional(),
    }),
    async (input) => {
      const id = Identifier.create("todo");
      const tags = clean(input.tags);
      const status = input.status ?? "backlog";
      const stage = trim(input.stage);
      return Database.transaction(async (tx) => {
        await tx.insert(TodoTable).values({
          id,
          createdBy: Actor.userID(),
          assignee: input.assignee ?? null,
          source: input.source ?? null,
          sourceID: input.sourceID ?? null,
          stage,
          title: input.title,
          body: input.body ?? null,
          status,
          tags,
          startDate: date(input.startDate),
          dueDate: date(input.dueDate),
          ...times(status, null),
        });
        await Event.create({
          type: "todo.created",
          source: "todo",
          sourceID: id,
          tags,
          data: {
            title: input.title,
            status,
            stage,
            assignee: input.assignee ?? null,
            startDate: input.startDate ?? null,
            dueDate: input.dueDate ?? null,
          },
        });
        return id;
      });
    },
  );

  export const list = fn(
    Common.PaginatedInput.extend({
      status: Status.optional(),
      /** A user id, or "none" for unassigned. */
      assignee: z.string().optional(),
      /** A stage name, or "none" for todos without one. */
      stage: z.string().optional(),
      source: z.string().optional(),
      sourceID: z.string().optional(),
      createdBy: z.string().optional(),
      search: z.string().optional(),
    }),
    (input) => {
      const { page, pageSize, limit, offset } = Common.page(input);
      const conditions = scope(input);
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
      if (input.search) conditions.push(ilike(TodoTable.title, `%${input.search}%`));
      const where = and(...conditions);
      return Database.use(async (tx) => {
        const [rows, totalRows] = await Promise.all([
          tx
            .select({ todo: TodoTable, user: assignee })
            .from(TodoTable)
            .leftJoin(UserTable, eq(TodoTable.assignee, UserTable.id))
            .where(where)
            .orderBy(desc(TodoTable.timeCreated))
            .limit(limit)
            .offset(offset),
          tx.select({ total: count() }).from(TodoTable).where(where),
        ] as const);
        return { data: rows.map(serialize), page, pageSize, total: totalRows[0]?.total ?? 0 };
      });
    },
  );

  /**
   * The stage list, aggregated from the todos wearing each label — a stage spans whatever
   * its members cover, so there is no second table that can drift out of sync.
   */
  export const stages = fn(
    z.object({ source: z.string().optional(), sourceID: z.string().optional() }),
    (input) =>
      Database.use((tx) =>
        tx
          .select({
            name: TodoTable.stage,
            total: count(),
            done: sql<number>`cast(count(*) filter (where ${TodoTable.status} = 'done') as int)`,
            start: min(TodoTable.startDate),
            end: max(TodoTable.dueDate),
          })
          .from(TodoTable)
          .where(and(...scope(input), isNotNull(TodoTable.stage)))
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
      ),
  );

  /** Renames a stage across every todo wearing it — the only stage edit there is. */
  export const rename = fn(
    z.object({
      from: z.string().min(1),
      to: z.string().min(1).max(64),
      source: z.string().optional(),
      sourceID: z.string().optional(),
    }),
    (input) =>
      Database.use((tx) =>
        tx
          .update(TodoTable)
          .set({ stage: input.to.trim(), timeUpdated: new Date() })
          .where(and(...scope(input), eq(TodoTable.stage, input.from))),
      ),
  );

  export const fromID = fn(Info.shape.id, (id) =>
    Database.use((tx) =>
      tx
        .select({ todo: TodoTable, user: assignee })
        .from(TodoTable)
        .leftJoin(UserTable, eq(TodoTable.assignee, UserTable.id))
        .where(and(eq(TodoTable.id, id), isNull(TodoTable.timeDeleted)))
        .then((rows) => (rows[0] ? serialize(rows[0]) : null)),
    ),
  );

  export const update = fn(Patch.extend({ id: Info.shape.id }), async ({ id, ...patch }) => {
    const before = found("Todo", await fromID.force(id));
    const next = {
      ...patch,
      ...(patch.tags !== undefined ? { tags: clean(patch.tags) } : {}),
      ...(patch.stage !== undefined ? { stage: trim(patch.stage) } : {}),
    };

    return Database.transaction(async (tx) => {
      await tx.update(TodoTable).set(fields(next, before)).where(eq(TodoTable.id, id));

      const tags = next.tags ?? before.tags;

      if (next.status !== undefined && next.status !== before.status)
        await Event.create({
          type: "todo.status",
          source: "todo",
          sourceID: id,
          tags,
          data: { from: before.status, to: next.status, reason: next.reason ?? null },
        });

      if (next.assignee !== undefined && next.assignee !== (before.assignee?.id ?? null))
        await Event.create({
          type: "todo.assigned",
          source: "todo",
          sourceID: id,
          tags,
          data: { from: before.assignee?.id ?? null, to: next.assignee },
        });

      const changed = diff(before, next);
      if (Object.keys(changed).length)
        await Event.create({
          type: "todo.updated",
          source: "todo",
          sourceID: id,
          tags,
          data: changed,
        });
    });
  });

  export const remove = fn(Info.shape.id, async (id) => {
    const before = found("Todo", await fromID.force(id));

    return Database.transaction(async (tx) => {
      await tx.update(TodoTable).set({ timeDeleted: new Date() }).where(eq(TodoTable.id, id));
      await Event.create({
        type: "todo.removed",
        source: "todo",
        sourceID: id,
        tags: before.tags,
        data: { title: before.title, status: before.status, tags: before.tags },
      });
    });
  });

  function serialize(row: { todo: typeof TodoTable.$inferSelect; user: Assignee }): Info {
    return {
      id: row.todo.id,
      createdBy: row.todo.createdBy,
      assignee: row.user,
      source: row.todo.source,
      sourceID: row.todo.sourceID,
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
    };
  }
}
