import { z } from "zod";
import { and, asc, count, desc, eq, ilike, inArray, isNull } from "drizzle-orm";
import { fn } from "../util/fn";
import { Database } from "../drizzle";
import { Actor } from "../actor";
import { Common } from "../common";
import { Examples } from "../examples";
import { Identifier } from "../identifier";
import { ErrorCodes, VisibleError } from "../error";
import { TodoStatuses, TodoTable } from "./todo.sql";

export { Insights } from "./insights";

export namespace Todo {
  export const Status = z.string().trim().min(1).max(64).meta({
    description:
      "Status of a todo item. Any short label; defaults are pending, in_progress and done.",
    example: "pending",
  });
  export type Status = z.infer<typeof Status>;

  export const Info = z
    .object({
      id: z.string().meta({ description: Common.IdDescription, example: Examples.Todo.id }),
      userID: z.string(),
      title: z.string().min(0).max(2000),
      status: Status,
      dueDate: z.iso.datetime().nullable(),
    })
    .meta({
      ref: "Todo",
      description: "A todo item that belongs to a user.",
      example: Examples.Todo,
    });
  export type Info = z.infer<typeof Info>;

  export const create = fn(
    z.object({
      title: Info.shape.title,
      status: Status.optional(),
      dueDate: Info.shape.dueDate.optional(),
    }),
    async (input) => {
      const id = Identifier.create("todo");
      await Database.use((tx) =>
        tx.insert(TodoTable).values({
          id,
          userID: Actor.userID(),
          title: input.title,
          status: input.status,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
        }),
      );
      return id;
    },
  );

  export const statuses = fn(z.void(), () =>
    Database.use((tx) =>
      tx
        .selectDistinct({ status: TodoTable.status })
        .from(TodoTable)
        .where(and(eq(TodoTable.userID, Actor.userID()), isNull(TodoTable.timeDeleted)))
        .orderBy(asc(TodoTable.status))
        .then((rows) => [...new Set([...TodoStatuses, ...rows.map((row) => row.status)])]),
    ),
  );

  export const list = fn(
    Common.PaginatedInput.extend({ status: Status.array().optional(), search: z.string().optional() }),
    (input) => {
      const { page, pageSize, limit, offset } = Common.page(input);
      const conditions = [eq(TodoTable.userID, Actor.userID()), isNull(TodoTable.timeDeleted)];
      if (input.status?.length) conditions.push(inArray(TodoTable.status, input.status));
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

  export const fromID = fn(Info.shape.id, (id) =>
    Database.use((tx) =>
      tx
        .select()
        .from(TodoTable)
        .where(
          and(
            eq(TodoTable.id, id),
            eq(TodoTable.userID, Actor.userID()),
            isNull(TodoTable.timeDeleted),
          ),
        )
        .then((rows) => (rows[0] ? serialize(rows[0]) : null)),
    ),
  );

  export const update = fn(
    z.object({
      id: Info.shape.id,
      title: Info.shape.title.optional(),
      status: Status.optional(),
      dueDate: Info.shape.dueDate.optional(),
    }),
    async ({ id, ...patch }) => {
      const existing = await fromID.force(id);
      if (!existing)
        throw new VisibleError(
          "not_found",
          ErrorCodes.NotFound.RESOURCE_NOT_FOUND,
          "Todo not found",
        );

      return Database.use((tx) =>
        tx
          .update(TodoTable)
          .set({
            ...(patch.title !== undefined ? { title: patch.title } : {}),
            ...(patch.status !== undefined ? { status: patch.status } : {}),
            ...(patch.dueDate ? { dueDate: new Date(patch.dueDate) } : {}),
            timeUpdated: new Date(),
          })
          .where(and(eq(TodoTable.id, id), eq(TodoTable.userID, Actor.userID()))),
      );
    },
  );

  export const remove = fn(Info.shape.id, async (id) => {
    const existing = await fromID.force(id);
    if (!existing)
      throw new VisibleError("not_found", ErrorCodes.NotFound.RESOURCE_NOT_FOUND, "Todo not found");

    return Database.use((tx) =>
      tx
        .update(TodoTable)
        .set({ timeDeleted: new Date() })
        .where(and(eq(TodoTable.id, id), eq(TodoTable.userID, Actor.userID()))),
    );
  });

  function serialize(row: typeof TodoTable.$inferSelect): Info {
    return {
      id: row.id,
      userID: row.userID,
      title: row.title,
      status: row.status,
      dueDate: row.dueDate?.toISOString() ?? null,
    };
  }
}
