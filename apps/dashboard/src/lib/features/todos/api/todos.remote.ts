import { query } from "$app/server";
import { error } from "@sveltejs/kit";
import { z } from "zod";
import { Todo } from "@template/core/todo";
import { auth, remote } from "$lib/server/remote";
// import { api } from '$lib/server/api';

export const getTodos = query(
  z.object({ state: Todo.State.optional(), q: z.string().optional() }),
  async (input) => {
    auth();
    const { data } = await Todo.list({ state: input.state, search: input.q });
    return data;

    // API/SDK version, kept as an example of calling the HTTP API instead of core directly:
    // const { data } = await api().getTodo(input);
    // return data?.data ?? [];
  },
);

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
      body: z
        .string()
        .optional()
        .transform((s) => s || undefined),
    }),
  )
  .form();

export const closeTodo = remote(Todo.update)
  .with(
    z
      .object({ id: Todo.Info.shape.id, reason: z.enum(["completed", "not_planned"]).optional() })
      .transform((input) => ({
        id: input.id,
        state: "closed" as const,
        stateReason: input.reason ?? "completed",
      })),
  )
  .form();

export const reopenTodo = remote(Todo.update)
  .with(
    z.object({ id: Todo.Info.shape.id }).transform((input) => ({
      id: input.id,
      state: "open" as const,
    })),
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
