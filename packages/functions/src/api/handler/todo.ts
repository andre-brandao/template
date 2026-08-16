import { z } from "zod";
import { Hono } from "hono";
import { validator, PaginatedQuery, authRequired } from "../common";
import { describe } from "../doc";
import { Todo } from "@template/core/todo";
import { found } from "@template/core/error";

export namespace TodoApi {
  const doc = describe("Todo");
  const id = z.object({ id: Todo.Info.shape.id });

  export const route = new Hono()
    .get(
      "/",
      doc(Todo.list.meta, {
        200: doc.page(Todo.Info),
        400: doc.error(400),
        401: doc.error(401),
        403: doc.error(403),
        500: doc.error(500),
      }),
      authRequired,
      validator("query", PaginatedQuery(Todo.list.schema)),
      async (c) => c.json(await Todo.list(c.req.valid("query")), 200),
    )
    .get(
      "/stage",
      doc(Todo.stages.meta, {
        200: doc.list(Todo.Stage),
        400: doc.error(400),
        401: doc.error(401),
        403: doc.error(403),
        500: doc.error(500),
      }),
      authRequired,
      validator("query", Todo.stages.schema),
      async (c) => c.json(await Todo.stages(c.req.valid("query")), 200),
    )
    .get(
      "/:id",
      doc(Todo.fromID.meta, {
        200: doc.json(Todo.Info),
        400: doc.error(400),
        401: doc.error(401),
        403: doc.error(403),
        404: doc.error(404),
        500: doc.error(500),
      }),
      authRequired,
      validator("param", id),
      async (c) => c.json(found("Todo", await Todo.fromID(c.req.valid("param").id)), 200),
    )
    .post(
      "/",
      doc(Todo.create.meta, {
        200: doc.json(Todo.Info),
        400: doc.error(400),
        401: doc.error(401),
        403: doc.error(403),
        500: doc.error(500),
      }),
      authRequired,
      validator("json", Todo.create.schema),
      async (c) => c.json(await Todo.create(c.req.valid("json")), 200),
    )
    .patch(
      "/:id",
      doc(Todo.update.meta, {
        200: doc.json(Todo.Info),
        400: doc.error(400),
        401: doc.error(401),
        403: doc.error(403),
        404: doc.error(404),
        500: doc.error(500),
      }),
      authRequired,
      validator("param", id),
      validator("json", Todo.update.schema.omit({ id: true })),
      async (c) => {
        const { id } = c.req.valid("param");
        await Todo.update({ id, ...c.req.valid("json") });
        return c.json(await Todo.fromID(id), 200);
      },
    )
    .delete(
      "/:id",
      doc(Todo.remove.meta, {
        200: doc.ok,
        400: doc.error(400),
        401: doc.error(401),
        403: doc.error(403),
        404: doc.error(404),
        500: doc.error(500),
      }),
      authRequired,
      validator("param", id),
      async (c) => {
        await Todo.remove(c.req.valid("param").id);
        return c.json("ok" as const, 200);
      },
    );
}
