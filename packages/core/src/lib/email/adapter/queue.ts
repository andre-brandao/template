import { z } from "zod";
import { Actor } from "../../../actor";
import { Queue } from "../../queue";
import { Email } from "../index";
import type { Port } from "../port";

/**
 * The deferred send. Its handler is whatever driver the running process provides.
 * Called lazily — `Email.fromEnv` imports this module, so resolving `Email.send` at
 * define time would race the cycle.
 */
export const job = Queue.define(
  "email.send",
  z.object({
    from: z.string().optional(),
    to: z.union([z.string(), z.string().array()]),
    subject: z.string(),
    body: z.string(),
    html: z.string().optional(),
    // Mirrors `Email.Attachment` — anything missing here is stripped by `parse` on push.
    attachments: z
      .object({
        filename: z.string(),
        content: z.string(),
        contentType: z.string().optional(),
        encoding: z.string().optional(),
      })
      .array()
      .optional(),
  }),
  (input) => Email.send(input),
);

/**
 * Hands the mail to the queue instead of a provider, so an app that sends mail only
 * needs a queue driver — no SMTP credentials, no Cloudflare `send_email` binding. The
 * process that runs the job is the one that holds a real driver.
 *
 * Pair it with a queue driver that defers (`db`, `cloudflare`, `memory`). `sync` runs
 * the handler inline, where it resolves this driver right back and loops.
 */
export function queue(): Port {
  return {
    async send(msg) {
      const info = Actor.use();
      await job.push(msg, { userID: info.type === "user" ? info.properties.userID : null });
    },
  };
}
