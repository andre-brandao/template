import { Actor } from "../../../actor";
import type { Email } from "../index";
import type { Port } from "../port";

/**
 * Hands the mail to the queue instead of a provider, so an app that sends mail only
 * needs a queue driver — no SMTP credentials, no Cloudflare `send_email` binding. The
 * process that runs the job is the one that holds a real driver.
 *
 * `push` is the deferred-send job's dispatcher, handed in by `Email` — taking it as a
 * parameter (the import above is type-only, erased at runtime) keeps this adapter from
 * importing `Email` back and closing a cycle.
 *
 * Pair it with a queue driver that defers (`db`, `cloudflare`, `memory`). `sync` runs
 * the handler inline, where it resolves this driver right back and loops.
 */
export function queue(push: typeof Email.job.push): Port {
  return {
    async send(msg) {
      const info = Actor.use();
      await push(msg, { userID: info.type === "user" ? info.properties.userID : null });
    },
  };
}
