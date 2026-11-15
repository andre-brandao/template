import { z } from "zod";
import { Hono } from "hono";
import { validator, authRequired } from "../common";
import { describe } from "../doc";
import { App } from "@template/core/app";
import { Key } from "@template/core/key";

export namespace AppApi {
  const doc = describe("App");
  const id = z.object({ id: App.Info.shape.id });

  export const route = new Hono()
    .get(
      "/",
      doc(App.list.meta, {
        200: doc.list(App.Info),
        ...doc.errors(401, 403, 500),
      }),
      authRequired,
      async (c) => c.json(await App.list(), 200),
    )
    .get(
      "/:id",
      doc(App.fromID.meta, {
        200: doc.json(App.Info),
        ...doc.errors(400, 401, 403, 404, 500),
      }),
      authRequired,
      validator("param", id),
      async (c) => c.json(await App.assert.exists(App.fromID(c.req.valid("param").id)), 200),
    )
    .post(
      "/",
      doc(App.create.meta, {
        200: doc.json(App.Info),
        ...doc.errors(400, 401, 403, 500),
      }),
      authRequired,
      validator("json", App.create.schema),
      async (c) => c.json(await App.create(c.req.valid("json")), 200),
    )
    .patch(
      "/:id",
      doc(App.update.meta, {
        200: doc.json(App.Info),
        ...doc.errors(400, 401, 403, 404, 500),
      }),
      authRequired,
      validator("param", id),
      validator("json", App.update.schema.omit({ id: true })),
      async (c) => {
        const param = c.req.valid("param");
        await App.update({ id: param.id, ...c.req.valid("json") });
        return c.json(await App.assert.exists(App.fromID(param.id)), 200);
      },
    )
    .delete(
      "/:id",
      doc(App.remove.meta, {
        200: doc.ok,
        ...doc.errors(400, 401, 403, 404, 500),
      }),
      authRequired,
      validator("param", id),
      async (c) => {
        await App.remove(c.req.valid("param").id);
        return c.json("ok" as const, 200);
      },
    )
    .get(
      "/:id/key",
      doc(App.keys.meta, {
        200: doc.list(Key.Info),
        ...doc.errors(400, 401, 403, 404, 500),
      }),
      authRequired,
      validator("param", id),
      async (c) => c.json(await App.keys(c.req.valid("param").id), 200),
    )
    .post(
      "/:id/key",
      // Literal, not `App.key.meta`: the route takes `expiresInDays` where core takes a date.
      doc(
        {
          title: "Create app key",
          description:
            "Mint a named API key that acts as the app. The secret is returned once, in `key`. Pass `expiresInDays` to set an expiry. Admin-only.",
        },
        {
          200: doc.json(Key.Info),
          ...doc.errors(400, 401, 403, 404, 500),
        },
      ),
      authRequired,
      validator("param", id),
      validator(
        "json",
        z.object({
          name: Key.Info.shape.name,
          expiresInDays: z.number().int().positive().optional(),
        }),
      ),
      async (c) => {
        const body = c.req.valid("json");
        const key = await App.key({
          app: c.req.valid("param").id,
          name: body.name,
          expiresAt: Key.expires(body.expiresInDays),
        });
        return c.json(key, 200);
      },
    )
    .delete(
      "/:id/key/:key",
      doc(App.revoke.meta, {
        200: doc.ok,
        ...doc.errors(400, 401, 403, 404, 500),
      }),
      authRequired,
      validator("param", z.object({ id: App.Info.shape.id, key: Key.Info.shape.id })),
      async (c) => {
        const param = c.req.valid("param");
        await App.revoke({ app: param.id, id: param.key });
        return c.json("ok" as const, 200);
      },
    )
    .post(
      "/:id/secret",
      doc(App.secret.meta, {
        200: doc.json(
          z
            .object({ secret: z.string().meta({ description: "The new inbound signing secret." }) })
            .meta({ description: "The secret, shown this once." }),
        ),
        ...doc.errors(400, 401, 403, 404, 500),
      }),
      authRequired,
      validator("param", id),
      async (c) => c.json({ secret: await App.secret(c.req.valid("param").id) }, 200),
    );
}
