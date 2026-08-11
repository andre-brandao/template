import { query } from "$app/server";
import { error } from "@sveltejs/kit";
import { z } from "zod";
import { Todo } from "@template/core/todo";
import { User } from "@template/core/user";
import { auth, remote } from "$lib/server/remote";

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

export const getTodos = query(
  z.object({
    status: Todo.Status.optional(),
    assignee: z.string().optional(),
    stage: z.string().optional(),
    source: z.string().optional(),
    sourceID: z.string().optional(),
    q: z.string().optional(),
  }),
  async (input) => {
    auth();
    // One page feeds every view — the board and timeline group client-side.
    const { data } = await Todo.list({ ...input, search: input.q, pageSize: 100 });
    return data;
  },
);

export const getStages = remote(Todo.stages).query();

export const getUsers = remote(User.list).query();

export const getTodo = query(Todo.Info.shape.id, async (id) => {
  auth();
  const todo = await Todo.fromID(id);
  if (!todo) error(404, "Todo not found");
  return todo;
});

export const createTodo = remote(Todo.create)
  .with(
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
  )
  .form();

export const setStatus = remote(Todo.update)
  .with(
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
  )
  .form();

/** The scheduling fields, edited together on the detail page. */
export const planTodo = remote(Todo.update)
  .with(
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
  )
  .form();

export const renameStage = remote(Todo.rename)
  .with(
    z.object({
      from: z.string().min(1),
      to: z.string().min(1).max(64),
      source: blank,
      sourceID: blank,
    }),
  )
  .form();

export const updateTodo = remote(Todo.update)
  .with(
    z.object({
      id: Todo.Info.shape.id,
      body: z
        .string()
        .optional()
        .transform((s) => s || null),
    }),
  )
  .form();

export const removeTodo = remote(Todo.remove)
  .with(z.object({ id: Todo.Info.shape.id }).transform((input) => input.id))
  .form();
