// fallow-ignore-file code-duplication
import { z } from "zod";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { Result, validator, ErrorResponses, authRequired } from "../common";
import { Key } from "@template/core/key";
import { Actor } from "@template/core/actor";
import { Examples } from "@template/core/examples";

export namespace KeyApi {
  export const route = new Hono()
    .get(
      "/",
      describeRoute({
        tags: ["Key"],
        summary: "List keys",
        description:
          "List the current user's API keys and active sessions. Session secrets are withheld; the key authenticating this request is flagged `current`.",
        responses: {
          200: {
            content: {
              "application/json": { schema: Result(Key.Info.array()), example: [Examples.Key] },
            },
            description: "The user's keys and sessions.",
          },
          401: ErrorResponses[401],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      async (c) => {
        const keys = await Key.list(c.req.header("authorization")!.replace(/^Bearer /, ""));
        return c.json(keys, 200);
      },
    )
    .post(
      "/",
      describeRoute({
        tags: ["Key"],
        summary: "Create key",
        description: "Mint a named API key for the current user. API keys do not expire.",
        responses: {
          200: {
            content: { "application/json": { schema: Result(Key.Info), example: Examples.Key } },
            description: "The created key, including its secret.",
          },
          400: ErrorResponses[400],
          401: ErrorResponses[401],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      validator("json", Key.create.schema.pick({ name: true })),
      async (c) => {
        const key = await Key.create({
          userID: Actor.userID(),
          type: "api",
          name: c.req.valid("json").name,
        });
        return c.json(key, 200);
      },
    )
    .delete(
      "/:id",
      describeRoute({
        tags: ["Key"],
        summary: "Revoke key",
        description:
          "Revoke an API key or a session. The secret stops authenticating immediately — revoking your own session logs you out.",
        responses: {
          200: {
            content: { "application/json": { schema: Result(z.literal("ok")) } },
            description: "Revoked.",
          },
          401: ErrorResponses[401],
          404: ErrorResponses[404],
          500: ErrorResponses[500],
        },
      }),
      authRequired,
      validator("param", z.object({ id: z.string() })),
      async (c) => {
        await Key.remove(c.req.valid("param").id);
        return c.json("ok" as const, 200);
      },
    );
}
