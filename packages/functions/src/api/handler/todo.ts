// fallow-ignore-file code-duplication
import { z } from "zod";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import {
  Result,
  validator,
  ErrorResponses,
  PaginatedQuery,
  PaginatedResponse,
  authRequired,
} from "../common";
import { Todo } from "@template/core/todo";
import { Examples } from "@template/core/examples";
import { found } from "@template/core/error";

export namespace TodoApi {
  export const route = new Hono()
    .get(
      "/",
      describeRoute({
        tags: ["Todo"],
        summary: "List todos",
        description:
          "List todos, optionally narrowed by status, assignee, stage or owning entity. Paginated.",
        responses: {
          200: PaginatedResponse(Todo.Info, "A page of todos.", Examples.Todo),
          400: ErrorResponses[400],
          401: ErrorResponses[401],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      validator("query", PaginatedQuery(Todo.list.schema)),
      async (c) => {
        const todos = await Todo.list(c.req.valid("query"));
        return c.json(todos, 200);
      },
    )
    .get(
      "/stage",
      describeRoute({
        tags: ["Todo"],
        summary: "List stages",
        description:
          "The stage labels in use, with the span and counts derived from the todos in each.",
        responses: {
          200: {
            content: { "application/json": { schema: Result(z.array(Todo.Stage)) } },
            description: "The stages in use.",
          },
          400: ErrorResponses[400],
          401: ErrorResponses[401],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      validator(
        "query",
        z.object({ source: z.string().optional(), sourceID: z.string().optional() }),
      ),
      async (c) => {
        const stages = await Todo.stages(c.req.valid("query"));
        return c.json(stages, 200);
      },
    )
    .get(
      "/:id",
      describeRoute({
        tags: ["Todo"],
        summary: "Get todo",
        responses: {
          200: {
            content: { "application/json": { schema: Result(Todo.Info), example: Examples.Todo } },
            description: "The todo.",
          },
          400: ErrorResponses[400],
          401: ErrorResponses[401],
          404: ErrorResponses[404],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      validator("param", z.object({ id: Todo.Info.shape.id })),
      async (c) => {
        const todo = found("Todo", await Todo.fromID(c.req.valid("param").id));
        return c.json(todo, 200);
      },
    )
    .post(
      "/",
      describeRoute({
        tags: ["Todo"],
        summary: "Create todo",
        responses: {
          200: {
            content: { "application/json": { schema: Result(Todo.Info), example: Examples.Todo } },
            description: "The created todo.",
          },
          400: ErrorResponses[400],
          401: ErrorResponses[401],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      validator("json", Todo.create.schema),
      async (c) => c.json(await Todo.create(c.req.valid("json")), 200),
    )
    .patch(
      "/:id",
      describeRoute({
        tags: ["Todo"],
        summary: "Update todo",
        responses: {
          200: {
            content: { "application/json": { schema: Result(Todo.Info), example: Examples.Todo } },
            description: "The updated todo.",
          },
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
          200: {
            content: { "application/json": { schema: Result(z.literal("ok")) } },
            description: "Deleted.",
          },
          400: ErrorResponses[400],
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
