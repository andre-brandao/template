import { z } from "zod";
import { and, count, desc, eq, ilike, isNull } from "drizzle-orm";
import { fn } from "../util/fn";
import { found } from "../error";
import { Database } from "../drizzle";
import { Actor } from "../actor";
import { Common } from "../common";
import { Examples } from "../examples";
import { Identifier } from "../identifier";
import { Event } from "../event";
import { Permission } from "../organization/permission";
import { TodoTable } from "./todo.sql";

export { Insights } from "./insights";

export namespace Todo {
  export const State = z.enum(["open", "closed"]);
  export type State = z.infer<typeof State>;

  export const StateReason = z.enum(["completed", "not_planned"]).nullable();
  export type StateReason = z.infer<typeof StateReason>;

  const Tag = z.string().trim().min(1).max(64);

  export const Info = z
    .object({
      id: z.string().meta({ description: Common.IdDescription, example: Examples.Todo.id }),
      userID: z.string(),
      title: z.string().min(0).max(2000),
      body: z.string().max(20000).nullable(),
      state: State,
      stateReason: StateReason,
      tags: Tag.array().max(20),
      dueDate: z.iso.datetime().nullable(),
    })
    .meta({
      ref: "Todo",
      description: "A todo item that belongs to a user.",
      example: Examples.Todo,
    });
  export type Info = z.infer<typeof Info>;

  function clean(tags?: string[]) {
    return [...new Set((tags ?? []).map((tag) => tag.trim()).filter(Boolean))];
  }

  const Patch = Info.pick({
    title: true,
    body: true,
    tags: true,
    dueDate: true,
    state: true,
    stateReason: true,
  }).partial();
  type Patch = z.infer<typeof Patch>;

  function fields(patch: Patch) {
    return {
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.body !== undefined ? { body: patch.body } : {}),
      ...(patch.tags !== undefined ? { tags: patch.tags } : {}),
      ...(patch.dueDate ? { dueDate: new Date(patch.dueDate) } : {}),
      ...(patch.state !== undefined ? { state: patch.state, stateReason: patch.stateReason } : {}),
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
    if (patch.dueDate && patch.dueDate !== before.dueDate)
      changed.dueDate = { before: before.dueDate, after: patch.dueDate };
    return changed;
  }

  export const create = fn(
    z.object({
      title: Info.shape.title,
      body: Info.shape.body.optional(),
      tags: Info.shape.tags.optional(),
      dueDate: Info.shape.dueDate.optional(),
    }),
    async (input) => {
      Permission.assert("todo:write");
      const id = Identifier.create("todo");
      const tags = clean(input.tags);
      return Database.transaction(async (tx) => {
        await tx.insert(TodoTable).values({
          id,
          orgID: Actor.orgID(),
          userID: Actor.userID(),
          title: input.title,
          body: input.body ?? null,
          tags,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
        });
        await Event.create({
          type: "todo.created",
          source: "todo",
          sourceID: id,
          tags,
          data: {
            title: input.title,
            body: input.body ?? null,
            tags,
            dueDate: input.dueDate ?? null,
          },
        });
        return id;
      });
    },
  );

  export const list = fn(
    Common.PaginatedInput.extend({
      state: State.optional(),
      search: z.string().optional(),
    }),
    (input) => {
      Permission.assert("todo:read");
      const { page, pageSize, limit, offset } = Common.page(input);
      const conditions = [eq(TodoTable.orgID, Actor.orgID()), isNull(TodoTable.timeDeleted)];
      if (input.state) conditions.push(eq(TodoTable.state, input.state));
      if (input.search) conditions.push(ilike(TodoTable.title, `%${input.search}%`));
      const where = and(...conditions);
      return Database.use(async (tx) => {
        const [rows, totalRows] = await Promise.all([
          tx
            .select()
            .from(TodoTable)
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

  export const fromID = fn(Info.shape.id, async (id) => {
    Permission.assert("todo:read");
    return row(id);
  });

  /** Org-scoped lookup without a permission gate — write actions read their target through this. */
  function row(id: string) {
    return Database.use((tx) =>
      tx
        .select()
        .from(TodoTable)
        .where(
          and(eq(TodoTable.id, id), eq(TodoTable.orgID, Actor.orgID()), isNull(TodoTable.timeDeleted)),
        )
        .then((rows) => (rows[0] ? serialize(rows[0]) : null)),
    );
  }

  export const update = fn(Patch.extend({ id: Info.shape.id }), async ({ id, ...patch }) => {
    Permission.assert("todo:write");
    const before = found("Todo", await row(id));
    const tags = patch.tags !== undefined ? clean(patch.tags) : undefined;
    const reason =
      patch.state === undefined
        ? undefined
        : patch.state === "closed"
          ? (patch.stateReason ?? "completed")
          : null;
    const next = { ...patch, tags, stateReason: reason };

    return Database.transaction(async (tx) => {
      await tx
        .update(TodoTable)
        .set(fields(next))
        .where(and(eq(TodoTable.id, id), eq(TodoTable.orgID, Actor.orgID())));

      const list = tags ?? before.tags;

      if (patch.state !== undefined && patch.state !== before.state)
        await Event.create({
          type: patch.state === "closed" ? "todo.closed" : "todo.reopened",
          source: "todo",
          sourceID: id,
          tags: list,
          data: patch.state === "closed" ? { reason } : {},
        });

      const changed = diff(before, next);
      if (Object.keys(changed).length)
        await Event.create({
          type: "todo.updated",
          source: "todo",
          sourceID: id,
          tags: list,
          data: changed,
        });
    });
  });

  export const remove = fn(Info.shape.id, async (id) => {
    Permission.assert("todo:write");
    const before = found("Todo", await row(id));

    return Database.transaction(async (tx) => {
      await tx
        .update(TodoTable)
        .set({ timeDeleted: new Date() })
        .where(and(eq(TodoTable.id, id), eq(TodoTable.orgID, Actor.orgID())));
      await Event.create({
        type: "todo.removed",
        source: "todo",
        sourceID: id,
        tags: before.tags,
        data: { title: before.title, state: before.state, tags: before.tags },
      });
    });
  });

  function serialize(row: typeof TodoTable.$inferSelect): Info {
    return {
      id: row.id,
      userID: row.userID,
      title: row.title,
      body: row.body,
      state: row.state as State,
      stateReason: row.stateReason as StateReason,
      tags: row.tags,
      dueDate: row.dueDate?.toISOString() ?? null,
    };
  }
}
