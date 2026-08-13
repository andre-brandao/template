import { z } from "zod";
import { Context } from "../../context";
import { Log } from "../../util/log";
import { Queue } from "../queue";
import type * as port from "./port";
import { cloudflare } from "./adapter/cloudflare";
import { console } from "./adapter/console";
import { queue } from "./adapter/queue";

/**
 * Outbound mail over a swappable driver, same shape as `Queue` and `Storage`: `send`
 * fills in the default sender and hands the message to whichever driver the target
 * provided. The `cloudflare` driver isn't in `fromEnv` — its binding only exists
 * per-request in a Worker, so those targets wire it directly.
 */
export namespace Email {
  const log = Log.create({ namespace: "core.email" });

  const EMAIL_FROM = process.env.SMTP_FROM ?? "no.reply@developing.company";

  export type Attachment = port.Attachment;
  export type Message = port.Message;
  export type Port = port.Port;

  /**
   * The drivers, re-exported so a target only imports `Email`. `queue` is bound to the
   * deferred-send job here — handing `push` in keeps the adapter from importing `Email`
   * back and closing a cycle.
   */
  export const Providers = { cloudflare, console, queue: () => queue(job.push) };

  // Env fallback for callers that bypass a target's per-request wrapper (chiefly tests).
  const ctx = Context.port(() => fromEnv(process.env));
  export const provide = ctx.provide;
  export const provider = ctx.provider;
  export const use = ctx.use;

  export async function send(input: Omit<Message, "from"> & { from?: string }) {
    const from = input.from || EMAIL_FROM;
    log.info("sending email", { subject: `{{${input.subject}}}`, from, to: input.to });
    try {
      await use().send({ ...input, from });
    } catch (err) {
      log.warn("failed to send email", { err: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  }

  /**
   * `EMAIL_DRIVER=console|queue`. `queue` defers delivery to the job worker, so don't
   * set it in the process that runs jobs — the handler would push right back and loop.
   */
  export function fromEnv(env: Record<string, string | undefined>): Port {
    const driver = env.EMAIL_DRIVER ?? "console";
    log.info("using email driver", { driver });
    if (driver === "queue") return queue(job.push);
    return console();
  }

  /** The deferred send — its handler runs in whichever process holds a real driver. */
  export const job = Queue.define(
    "email.send",
    z.object({
      from: z.string().optional(),
      to: z.union([z.string(), z.string().array()]),
      subject: z.string(),
      body: z.string(),
      html: z.string().optional(),
      // Mirrors `Attachment` — anything missing here is stripped by `parse` on push.
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
    (input) => send(input),
  );
}
