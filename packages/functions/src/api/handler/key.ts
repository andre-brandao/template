import { z } from "zod";
import { Hono } from "hono";
import { validator, authRequired } from "../common";
import { describe } from "../doc";
import { Key } from "@template/core/key";
import { Actor } from "@template/core/actor";

export namespace KeyApi {
  const doc = describe("Key");

  export const route = new Hono()
    .get("/", doc(Key.list.meta, { 200: doc.list(Key.Info) }), authRequired, async (c) => {
      const keys = await Key.list(c.req.header("authorization")!.replace(/^Bearer /, ""));
      return c.json(keys, 200);
    })
    .post(
      "/",
      // Literal, not `Key.create.meta`: the route takes `expiresInDays` where core takes a date.
      doc(
        {
          title: "Create key",
          description:
            "Mint a named API key for the current user. Pass `expiresInDays` to set an expiry; omit it for a key that never expires.",
        },
        { 200: doc.json(Key.Info) },
      ),
      authRequired,
      validator(
        "json",
        z.object({
          name: Key.Info.shape.name,
          expiresInDays: z.number().int().positive().optional(),
        }),
      ),
      async (c) => {
        const body = c.req.valid("json");
        const key = await Key.create({
          userID: Actor.userID(),
          name: body.name,
          expiresAt: Key.expires(body.expiresInDays),
        });
        return c.json(key, 200);
      },
    )
    .delete(
      "/:id",
      doc(Key.remove.meta, { 200: doc.ok }),
      authRequired,
      validator("param", z.object({ id: Key.Info.shape.id })),
      async (c) => {
        await Key.remove(c.req.valid("param").id);
        return c.json("ok" as const, 200);
      },
    );
}
