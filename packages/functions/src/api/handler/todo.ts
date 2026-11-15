import { z } from "zod";
import { Hono } from "hono";
import { validator, PaginatedQuery, authRequired } from "../common";
import { describe } from "../doc";
import { Todo } from "@template/core/todo";
import { Link } from "@template/core/util/meta";

export namespace TodoApi {
  const doc = describe("Todo");
  const Identifier = z.object({ id: Todo.Info.shape.id });
  // The query string hands `unscheduled` over as text.
  const List = PaginatedQuery(Todo.list.schema).extend({
    unscheduled: z.preprocess(
      (value) => (value === "true" || value === "false" ? value === "true" : value),
      Todo.list.schema.shape.unscheduled,
    ),
  });

  export const route = new Hono()
    .get(
      "/",
      doc(Todo.list.meta, {
        200: doc.page(Todo.Info),
        ...doc.errors(400, 401, 403, 500),
      }),
      authRequired,
      validator("query", List),
      async (c) => c.json(await Todo.list(c.req.valid("query")), 200),
    )
    .get(
      "/stage",
      doc(Todo.stages.meta, {
        200: doc.list(Todo.Stage),
        ...doc.errors(400, 401, 403, 500),
      }),
      authRequired,
      validator("query", Todo.stages.schema),
      async (c) => c.json(await Todo.stages(c.req.valid("query")), 200),
    )
    .patch(
      "/stage",
      doc(Todo.rename.meta, {
        200: doc.ok,
        ...doc.errors(400, 401, 403, 500),
      }),
      authRequired,
      validator("json", Todo.rename.schema),
      async (c) => {
        await Todo.rename(c.req.valid("json"));
        return c.json("ok" as const, 200);
      },
    )
    .get(
      "/:id",
      doc(Todo.fromID.meta, {
        200: doc.json(Todo.Info),
        ...doc.errors(400, 401, 403, 404, 500),
      }),
      authRequired,
      validator("param", Identifier),
      async (c) => c.json(await Todo.assert.exists(Todo.fromID(c.req.valid("param").id)), 200),
    )
    .post(
      "/",
      doc(Todo.create.meta, {
        200: doc.json(Todo.Info),
        ...doc.errors(400, 401, 403, 500),
      }),
      authRequired,
      validator("json", Todo.create.schema),
      async (c) => c.json(await Todo.create(c.req.valid("json")), 200),
    )
    .patch(
      "/:id",
      doc(Todo.update.meta, {
        200: doc.json(Todo.Info),
        ...doc.errors(400, 401, 403, 404, 500),
      }),
      authRequired,
      validator("param", Identifier),
      validator("json", Todo.update.schema.omit({ id: true })),
      async (c) => {
        const { id } = c.req.valid("param");
        await Todo.update({ id, ...c.req.valid("json") });
        return c.json(await Todo.assert.exists(Todo.fromID.force(id)), 200);
      },
    )
    .post(
      "/:id/move",
      doc(Todo.move.meta, {
        200: doc.json(Todo.Info),
        ...doc.errors(400, 401, 403, 404, 500),
      }),
      authRequired,
      validator("param", Identifier),
      validator("json", Todo.move.schema.omit({ id: true })),
      async (c) => {
        const { id } = c.req.valid("param");
        await Todo.move({ id, ...c.req.valid("json") });
        return c.json(await Todo.assert.exists(Todo.fromID.force(id)), 200);
      },
    )
    .post(
      "/:id/link",
      doc(Todo.link.meta, {
        200: doc.json(Todo.Info),
        ...doc.errors(400, 401, 403, 404, 500),
      }),
      authRequired,
      validator("param", Identifier),
      validator("json", Link),
      async (c) =>
        c.json(await Todo.link({ id: c.req.valid("param").id, ...c.req.valid("json") }), 200),
    )
    .delete(
      "/:id/link",
      doc(Todo.unlink.meta, {
        200: doc.json(Todo.Info),
        ...doc.errors(400, 401, 403, 404, 500),
      }),
      authRequired,
      validator("param", Identifier),
      validator("query", Todo.unlink.schema.omit({ id: true })),
      async (c) =>
        c.json(await Todo.unlink({ id: c.req.valid("param").id, ...c.req.valid("query") }), 200),
    )
    .delete(
      "/:id",
      doc(Todo.remove.meta, {
        200: doc.ok,
        ...doc.errors(400, 401, 403, 404, 500),
      }),
      authRequired,
      validator("param", Identifier),
      async (c) => {
        await Todo.remove(c.req.valid("param").id);
        return c.json("ok" as const, 200);
      },
    );
}
