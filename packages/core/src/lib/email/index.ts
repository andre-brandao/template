import { Context } from "../../context";
import { Log } from "../../util/log";
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

  /** The drivers, re-exported so a target only imports `Email`. */
  export const Providers = { cloudflare, console, queue };

  const ctx = Context.create<Port>();
  let fallback: Port | undefined;

  export function provide<R>(port: Port, fn: () => R): R {
    return ctx.provide(port, fn);
  }

  /** Curried form of `provide` for composition via `Context.withProviders`. */
  export function provider(port: Port) {
    return <R>(fn: () => R) => provide(port, fn);
  }

  /**
   * Same env fallback as `Queue.use()`, for callers that bypass a target's
   * per-request wrapper (chiefly tests). Cached so the console driver warns once.
   */
  export function use(): Port {
    try {
      return ctx.use();
    } catch (err) {
      if (!(err instanceof Context.NotFound)) throw err;
      fallback ??= fromEnv(process.env);
      return fallback;
    }
  }

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
    if (driver === "queue") return queue();
    return console();
  }
}
