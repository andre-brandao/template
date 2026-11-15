import { z } from "zod";
import { Hono } from "hono";
import { validator, authRequired } from "../common";
import { describe } from "../doc";
import { Webhook } from "@template/core/webhook";

export namespace WebhookApi {
  const doc = describe("Webhook");
  const id = z.object({ id: Webhook.Info.shape.id });

  export const route = new Hono()
    .get(
      "/",
      doc(Webhook.list.meta, {
        200: doc.list(Webhook.Info),
        ...doc.errors(400, 401, 403, 500),
      }),
      authRequired,
      validator(
        "query",
        z.object({
          owner: z
            .string()
            .optional()
            .meta({ description: "Only this owner's subscriptions, like an app's account id." }),
        }),
      ),
      async (c) => c.json(await Webhook.list(c.req.valid("query").owner), 200),
    )
    .post(
      "/",
      doc(Webhook.create.meta, {
        200: doc.json(Webhook.Info),
        ...doc.errors(400, 401, 403, 500),
      }),
      authRequired,
      validator("json", Webhook.create.schema),
      async (c) => c.json(await Webhook.create(c.req.valid("json")), 200),
    )
    .patch(
      "/:id",
      doc(Webhook.update.meta, {
        200: doc.json(Webhook.Info),
        ...doc.errors(400, 401, 403, 404, 500),
      }),
      authRequired,
      validator("param", id),
      validator("json", Webhook.update.schema.omit({ id: true })),
      async (c) =>
        c.json(await Webhook.update({ id: c.req.valid("param").id, ...c.req.valid("json") }), 200),
    )
    .delete(
      "/:id",
      doc(Webhook.remove.meta, {
        200: doc.ok,
        ...doc.errors(400, 401, 403, 404, 500),
      }),
      authRequired,
      validator("param", id),
      async (c) => {
        await Webhook.remove(c.req.valid("param").id);
        return c.json("ok" as const, 200);
      },
    );
}
