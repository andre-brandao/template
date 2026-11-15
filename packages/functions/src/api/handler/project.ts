import { z } from "zod";
import { Hono } from "hono";
import { validator, PaginatedQuery, authRequired } from "../common";
import { describe } from "../doc";
import { Project } from "@template/core/project";
import { Link } from "@template/core/util/meta";

export namespace ProjectApi {
  const doc = describe("Project");
  const id = z.object({ id: Project.Info.shape.id });

  export const route = new Hono()
    .get(
      "/",
      doc(Project.list.meta, {
        200: doc.page(Project.Info),
        ...doc.errors(400, 401, 403, 500),
      }),
      authRequired,
      validator("query", PaginatedQuery(Project.list.schema)),
      async (c) => c.json(await Project.list(c.req.valid("query")), 200),
    )
    .get(
      "/:id",
      doc(Project.fromID.meta, {
        200: doc.json(Project.Info),
        ...doc.errors(400, 401, 403, 404, 500),
      }),
      authRequired,
      validator("param", id),
      async (c) =>
        c.json(await Project.assert.exists(Project.fromID(c.req.valid("param").id)), 200),
    )
    .post(
      "/",
      doc(Project.create.meta, {
        200: doc.json(Project.Info),
        ...doc.errors(400, 401, 403, 500),
      }),
      authRequired,
      validator("json", Project.create.schema),
      async (c) => c.json(await Project.create(c.req.valid("json")), 200),
    )
    .patch(
      "/:id",
      doc(Project.update.meta, {
        200: doc.json(Project.Info),
        ...doc.errors(400, 401, 403, 404, 500),
      }),
      authRequired,
      validator("param", id),
      validator("json", Project.update.schema.omit({ id: true })),
      async (c) =>
        c.json(await Project.update({ id: c.req.valid("param").id, ...c.req.valid("json") }), 200),
    )
    .delete(
      "/:id",
      doc(Project.remove.meta, {
        200: doc.ok,
        ...doc.errors(400, 401, 403, 404, 500),
      }),
      authRequired,
      validator("param", id),
      async (c) => {
        await Project.remove(c.req.valid("param").id);
        return c.json("ok" as const, 200);
      },
    )
    .post(
      "/:id/link",
      doc(Project.link.meta, {
        200: doc.json(Project.Info),
        ...doc.errors(400, 401, 403, 404, 500),
      }),
      authRequired,
      validator("param", id),
      validator("json", Link),
      async (c) =>
        c.json(await Project.link({ id: c.req.valid("param").id, ...c.req.valid("json") }), 200),
    )
    .delete(
      "/:id/link",
      doc(Project.unlink.meta, {
        200: doc.json(Project.Info),
        ...doc.errors(400, 401, 403, 404, 500),
      }),
      authRequired,
      validator("param", id),
      validator("query", Project.unlink.schema.omit({ id: true })),
      async (c) =>
        c.json(await Project.unlink({ id: c.req.valid("param").id, ...c.req.valid("query") }), 200),
    );
}
