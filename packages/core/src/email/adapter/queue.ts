import { z } from "zod";
import { Actor } from "../../actor";
import { Queue } from "../../lib/queue";
import { Email } from "../index";

/** The deferred send. Its handler is whatever sender the running process provides. */
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
  Email.send,
);

/**
 * Hands the mail to the queue instead of a provider, so an app that sends mail only
 * needs a queue driver — no SMTP credentials, no Cloudflare `send_email` binding. The
 * process that runs the job is the one that holds a real sender.
 *
 * Pair it with a driver that defers (`db`, `cloudflare`, `memory`). `sync` runs the
 * handler inline, where it resolves this sender right back and loops.
 */
export function createQueueSender(): Email.SenderPort {
  return {
    async send(input) {
      const info = Actor.use();
      await job.push(input, { userID: info.type === "user" ? info.properties.userID : null });
    },
  };
}
