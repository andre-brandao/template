import { form, query } from "$app/server";
import { error, redirect } from "@sveltejs/kit";
import { z } from "zod";
import { Todo } from "@template/core/todo";
import { Actor } from "@template/core/actor";
import { guard } from "$lib/server/guard";
// import { api } from '$lib/server/api';

function auth() {
  if (Actor.use().type !== "user") redirect(303, "/login");
}

export const getTodos = query(
  z.object({ status: Todo.Status.array().optional(), q: z.string().optional() }),
  async (input) => {
    auth();
    const { data } = await Todo.list(input);
    return data;

    // API/SDK version, kept as an example of calling the HTTP API instead of core directly:
    // const { data } = await api(getRequestEvent().locals.token).getTodo(input);
    // return data?.data ?? [];
  },
);

export const getStatuses = query(async () => {
  auth();
  return Todo.statuses();
});

export const getTodo = query(Todo.Info.shape.id, async (id) => {
  auth();
  const todo = await Todo.fromID(id);
  if (!todo) error(404, "Todo not found");
  return todo;
});

export const createTodo = form(
  Todo.create.schema.extend({ status: Todo.Status.or(z.literal("")).optional() }),
  async (input) => {
    auth();
    await guard(() => Todo.create({ ...input, status: input.status || undefined }));

    // const { error } = await api(getRequestEvent().locals.token).postTodo(input);
    // if (error) return { message: error.message };
  },
);

export const setStatus = form(
  z.object({ id: Todo.Info.shape.id, status: Todo.Status }),
  async (input) => {
    auth();
    await guard(() => Todo.update(input));

    // const { error } = await api(...).patchTodoById(input);
    // if (error) return { message: error.message };
  },
);

export const removeTodo = form(z.object({ id: Todo.Info.shape.id }), async (input) => {
  auth();
  await guard(() => Todo.remove(input.id));

  // const { error } = await api(...).deleteTodoById(input);
  // if (error) return { message: error.message };
});
