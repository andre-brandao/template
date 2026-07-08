import { z } from "zod";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { Result, validator, ErrorResponses, PaginatedQuery, PaginatedResponse, authRequired } from "../common";
import { Todo } from "@template/core/todo";
import { Examples } from "@template/core/examples";
import { ErrorCodes, VisibleError } from "@template/core/error";

export namespace TodoApi {
  export const route = new Hono()
    .get(
      "/",
      describeRoute({
        tags: ["Todo"],
        summary: "List todos",
        description: "List the current user's todos, optionally filtered by status. Paginated.",
        responses: {
          200: PaginatedResponse(Todo.Info, "A page of todos.", Examples.Todo),
          401: ErrorResponses[401],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      validator("query", PaginatedQuery.extend({ status: Todo.Status.optional() })),
      async (c) => {
        const input = c.req.valid("query");
        const todos = await Todo.list({ ...input, status: input.status ? [input.status] : undefined });
        return c.json(todos, 200);
      },
    )
    .get(
      "/:id",
      describeRoute({
        tags: ["Todo"],
        summary: "Get todo",
        responses: {
          200: { content: { "application/json": { schema: Result(Todo.Info), example: Examples.Todo } }, description: "The todo." },
          401: ErrorResponses[401],
          404: ErrorResponses[404],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      validator("param", z.object({ id: z.string() })),
      async (c) => {
        const todo = await Todo.fromID(c.req.valid("param").id);
        if (!todo)
          throw new VisibleError("not_found", ErrorCodes.NotFound.RESOURCE_NOT_FOUND, "Todo not found");
        return c.json(todo, 200);
      },
    )
    .post(
      "/",
      describeRoute({
        tags: ["Todo"],
        summary: "Create todo",
        responses: {
          200: { content: { "application/json": { schema: Result(Todo.Info) } }, description: "The created todo." },
          400: ErrorResponses[400],
          401: ErrorResponses[401],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      validator("json", Todo.create.schema),
      async (c) => {
        const id = await Todo.create(c.req.valid("json"));
        const todo = await Todo.fromID(id);
        return c.json(todo, 200);
      },
    )
    .patch(
      "/:id",
      describeRoute({
        tags: ["Todo"],
        summary: "Update todo",
        responses: {
          200: { content: { "application/json": { schema: Result(Todo.Info) } }, description: "The updated todo." },
          400: ErrorResponses[400],
          401: ErrorResponses[401],
          404: ErrorResponses[404],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      validator("param", z.object({ id: z.string() })),
      validator("json", Todo.update.schema.omit({ id: true })),
      async (c) => {
        const { id } = c.req.valid("param");
        await Todo.update({ id, ...c.req.valid("json") });
        const todo = await Todo.fromID(id);
        return c.json(todo, 200);
      },
    )
    .delete(
      "/:id",
      describeRoute({
        tags: ["Todo"],
        summary: "Delete todo",
        responses: {
          200: { content: { "application/json": { schema: Result(z.literal("ok")) } }, description: "Deleted." },
          401: ErrorResponses[401],
          404: ErrorResponses[404],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      validator("param", z.object({ id: z.string() })),
      async (c) => {
        await Todo.remove(c.req.valid("param").id);
        return c.json("ok" as const, 200);
      },
    );
}
