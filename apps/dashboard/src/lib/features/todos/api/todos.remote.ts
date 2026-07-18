import { form, query } from "$app/server";
import { error, redirect } from "@sveltejs/kit";
import { z } from "zod";
import { Todo } from "@template/core/todo";
import { Event } from "@template/core/event";
import { Actor } from "@template/core/actor";
import { guard } from "$lib/server/guard";
// import { api } from '$lib/server/api';

function auth() {
  if (Actor.use().type !== "user") redirect(303, "/login");
}

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

export const getEvents = query(Todo.Info.shape.id, async (id) => {
  auth();
  return Event.list({ source: "todo", sourceID: id });
});

export const createTodo = form(
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
  async (input) => {
    auth();
    await guard(() => Todo.create(input));

    // const { error } = await api().postTodo(input);
    // if (error) return { message: error.message };
  },
);

export const closeTodo = form(
  z.object({ id: Todo.Info.shape.id, reason: z.enum(["completed", "not_planned"]).optional() }),
  async (input) => {
    auth();
    await guard(() =>
      Todo.update({ id: input.id, state: "closed", stateReason: input.reason ?? "completed" }),
    );
  },
);

export const reopenTodo = form(z.object({ id: Todo.Info.shape.id }), async (input) => {
  auth();
  await guard(() => Todo.update({ id: input.id, state: "open" }));
});

export const updateTodo = form(
  z.object({
    id: Todo.Info.shape.id,
    body: z
      .string()
      .optional()
      .transform((s) => s || null),
  }),
  async (input) => {
    auth();
    await guard(() => Todo.update(input));
  },
);

export const removeTodo = form(z.object({ id: Todo.Info.shape.id }), async (input) => {
  auth();
  await guard(() => Todo.remove(input.id));

  // const { error } = await api(...).deleteTodoById(input);
  // if (error) return { message: error.message };
});
