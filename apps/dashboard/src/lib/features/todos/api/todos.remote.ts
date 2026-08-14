import { error } from "@sveltejs/kit";
import { z } from "zod";
import { Todo } from "@template/core/todo";
import { User } from "@template/core/user";
import { remote } from "$lib/server/remote";

/** `<input type="date">` gives a bare day; core wants a full instant. */
const day = z
  .string()
  .optional()
  .transform((s) => (s ? new Date(s).toISOString() : undefined));

const blank = z
  .string()
  .optional()
  .transform((s) => s || undefined);

/** A cleared select means "unassigned", not "leave it alone". */
const clearable = z
  .string()
  .optional()
  .transform((s) => s || null);

export const getTodos = remote.query(
  z.object({
    status: Todo.Status.optional(),
    assignee: z.string().optional(),
    stage: z.string().optional(),
    source: z.string().optional(),
    sourceID: z.string().optional(),
    q: z.string().optional(),
  }),
  async (input) => {
    // One page feeds every view — the board and timeline group client-side.
    const { data } = await Todo.list({ ...input, search: input.q, pageSize: 100 });
    return data;
  },
);

export const getStages = remote.core(Todo.stages).query();

export const getUsers = remote.core(User.list).query();

export const getTodo = remote.query(Todo.Info.shape.id, async (id) => {
  const todo = await Todo.fromID(id);
  if (!todo) error(404, "Todo not found");
  return todo;
});

export const createTodo = remote.form(
  Todo.create.schema.extend({
    tags: z
      .string()
      .optional()
      .transform((s) =>
        s
          ? s
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
          : undefined,
      ),
    body: blank,
    stage: blank,
    assignee: blank,
    source: blank,
    sourceID: blank,
    startDate: day,
    dueDate: day,
  }),
  Todo.create,
);

export const setStatus = remote.form(
  z
    .object({
      id: Todo.Info.shape.id,
      status: Todo.Status,
      reason: z
        .string()
        .optional()
        .transform((s) => s?.trim() || null),
    })
    .transform((input) => ({ id: input.id, status: input.status, reason: input.reason })),
  Todo.update,
);

/** The scheduling fields, edited together on the detail page. */
export const planTodo = remote.form(
  z.object({
    id: Todo.Info.shape.id,
    stage: clearable,
    assignee: clearable,
    startDate: z
      .string()
      .optional()
      .transform((s) => (s ? new Date(s).toISOString() : null)),
    dueDate: z
      .string()
      .optional()
      .transform((s) => (s ? new Date(s).toISOString() : null)),
  }),
  Todo.update,
);

export const renameStage = remote.form(
  z.object({
    from: z.string().min(1),
    to: z.string().min(1).max(64),
    source: blank,
    sourceID: blank,
  }),
  Todo.rename,
);

export const updateTodo = remote.form(
  z.object({
    id: Todo.Info.shape.id,
    body: z
      .string()
      .optional()
      .transform((s) => s || null),
  }),
  Todo.update,
);

export const removeTodo = remote.form(
  z.object({ id: Todo.Info.shape.id }).transform((input) => input.id),
  Todo.remove,
);
