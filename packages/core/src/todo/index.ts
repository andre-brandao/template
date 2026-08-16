import { z } from "zod";
import { and, asc, count, desc, eq, ilike, isNotNull, isNull, max, min, sql } from "drizzle-orm";
import { fn } from "../util/fn";
import { found } from "../error";
import { Database } from "../drizzle";
import { Actor } from "../actor";
import { Common } from "../common";
import { Examples } from "../examples";
import { Identifier } from "../identifier";
import { order } from "../drizzle/order";
import { date, iso, trim } from "../util/fmt";
import { clean, Tags } from "../util/tag";
import { Event } from "../platform/event";
import { UserTable } from "../user/user.sql";
import { rank, StatusValues, TodoTable } from "./todo.sql";

export { Insights } from "./insights";

export namespace Todo {
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
    .extend({ assignee: z.string().nullable() })
    .partial();
  type Patch = z.infer<typeof Patch>;

  /** The assignee columns worth joining — never the whole user row. */
  const assignee = { id: UserTable.id, name: UserTable.name, image: UserTable.image };

  export const create = fn(
    z.object({
      title: Info.shape.title,
      body: Info.shape.body.optional(),
      tags: Info.shape.tags.optional(),
      stage: Info.shape.stage.optional(),
      assignee: Patch.shape.assignee,
      source: Info.shape.source.optional(),
      sourceID: Info.shape.sourceID.optional(),
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
        const todo = found("Todo", await fromID.force(id));
        await Event.publish({
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
          state: todo,
        });
        return todo;
      });
    },
  );

  export const list = fn(
    Common.Query([
      "title",
      "status",
      "stage",
      "assignee",
      "startDate",
      "dueDate",
      "timeCreated",
    ]).extend({
      status: Status.optional(),
      /** A user id, or "none" for unassigned. */
      assignee: z.string().optional(),
      /** A stage name, or "none" for todos without one. */
      stage: Info.shape.stage.unwrap().optional(),
      source: Info.shape.source.unwrap().optional(),
      sourceID: Info.shape.sourceID.unwrap().optional(),
      createdBy: Info.shape.createdBy.optional(),
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
      if (input.search) conditions.push(ilike(TodoTable.title, `%${input.search}%`));
      const where = and(...conditions);
      return Database.use(async (tx) => {
        const [rows, totalRows] = await Promise.all([
          tx
            .select({ todo: TodoTable, user: assignee })
            .from(TodoTable)
            .leftJoin(UserTable, eq(TodoTable.assignee, UserTable.id))
            .where(where)
            .orderBy(
              ...order(TodoTable, input.sort, desc(TodoTable.timeCreated), {
                assignee: assignee.name,
                status: rank,
              }),
            )
            .limit(limit)
            .offset(offset),
          tx.select({ total: count() }).from(TodoTable).where(where),
        ] as const);
        return { data: rows.map(serialize), page, pageSize, total: totalRows[0]?.total ?? 0 };
      });
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
  );

  export const fromID = fn(Info.shape.id, (id) => {
    Actor.check({ todo: ["read"] });
    return Database.use((tx) =>
      tx
        .select({ todo: TodoTable, user: assignee })
        .from(TodoTable)
        .leftJoin(UserTable, eq(TodoTable.assignee, UserTable.id))
        .where(and(eq(TodoTable.id, id), isNull(TodoTable.timeDeleted)))
        .then((rows) => (rows[0] ? serialize(rows[0]) : null)),
    );
  });

  export const update = fn(Patch.extend({ id: Info.shape.id }), async ({ id, ...patch }) => {
    const before = found("Todo", await fromID.force(id));
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
  });

  export const remove = fn(Info.shape.id, async (id) => {
    const before = found("Todo", await fromID.force(id));
    Actor.check({ todo: ["delete"] }, before.createdBy);

    return Database.transaction(async (tx) => {
      await tx.update(TodoTable).set({ timeDeleted: new Date() }).where(eq(TodoTable.id, id));
      await Event.publish({
        type: "todo.removed",
        source: "todo",
        sourceID: id,
        tags: before.tags,
        data: { title: before.title, status: before.status, tags: before.tags },
        state: before,
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

  // === UTILS ===

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
    await Event.create({
      type: "todo.status",
      source: "todo",
      sourceID: id,
      tags,
      data: { from: before.status, to: next.status, reason: next.reason ?? null },
    });
  }

  async function assigned(id: string, before: Info, next: Patch, tags: string[]) {
    const prev = before.assignee?.id ?? null;
    if (next.assignee === undefined || next.assignee === prev) return;
    await Event.create({
      type: "todo.assigned",
      source: "todo",
      sourceID: id,
      tags,
      data: { from: prev, to: next.assignee },
    });
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
    await Event.publish({
      type: "todo.updated",
      source: "todo",
      sourceID: id,
      tags,
      data: changed,
      state: found("Todo", await fromID.force(id)),
    });
  }
}
