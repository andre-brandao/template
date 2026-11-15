import { z } from "zod";
import { Hono } from "hono";
import { describe } from "../doc";
import { App } from "@template/core/app";

/**
 * Inbound posts from a registered App. No bearer: the signature over the raw body is the
 * credential, so the body is read as text and never re-serialised before it is checked.
 */
export namespace HookApi {
  const doc = describe("Hook");

  export const route = new Hono().post(
    "/:app",
    doc(
      {
        title: "Post an event",
        description:
          "Send `{ type, data }` as an App. Sign it like outbound webhooks: base64url HMAC-SHA256 of `${body}.${timestamp}` with the App's inbound secret, in `x-webhook-signature`, and the unix `x-webhook-timestamp` (within five minutes). It is recorded as an `app.received` event for a subscriber to act on.",
      },
      {
        202: doc.json(
          z
            .object({ id: z.string().meta({ description: "The recorded event's id." }) })
            .meta({ description: "The post was verified and recorded." }),
        ),
        ...doc.errors(400, 401, 500),
      },
    ),
    async (c) => {
      const event = await App.receive({
        app: c.req.param("app"),
        body: await c.req.text(),
        timestamp: c.req.header("x-webhook-timestamp") ?? "",
        signature: c.req.header("x-webhook-signature") ?? "",
      });
      return c.json({ id: event.id }, 202);
    },
  );
}
