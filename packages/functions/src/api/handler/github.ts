import { z } from "zod";
import { Hono } from "hono";
import { ErrorCodes, VisibleError } from "@template/core/error";
import { Github } from "@template/core/github";
import { describe } from "../doc";

export namespace GithubApi {
  const doc = describe("GitHub");

  export const route = new Hono().post(
    "/webhook",
    doc(
      {
        title: "Receive GitHub webhook",
        description:
          "GitHub's delivery endpoint for `issues` and `sub_issues` events. Signed with `X-Hub-Signature-256`; queued, then synced into the connected project.",
      },
      {
        200: doc.json(z.literal("ok").meta({ description: "Queued for processing." })),
        ...doc.errors(401, 500),
      },
    ),
    async (c) => {
      // The signature covers the raw bytes, so the body is read as text before parsing.
      const body = await c.req.text();
      const secret = process.env.GITHUB_WEBHOOK_SECRET ?? "";
      if (!(await Github.Webhook.verify(secret, body, c.req.header("x-hub-signature-256"))))
        throw new VisibleError(
          "authentication",
          ErrorCodes.Authentication.UNAUTHORIZED,
          "Invalid webhook signature",
        );
      await Github.Webhook.job.push({
        event: c.req.header("x-github-event") ?? "",
        payload: JSON.parse(body),
      });
      return c.json("ok" as const, 200);
    },
  );
}
