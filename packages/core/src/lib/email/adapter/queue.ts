import { Identity } from "../../../identity";
import type { Email } from "../index";
import type { Port } from "../port";

/**
 * Sends by pushing the deferred-send job; the worker process holds the real driver.
 * `push` is a param to avoid an import cycle. Don't pair with the `sync` queue driver — it loops.
 */
export function queue(push: typeof Email.job.push): Port {
  return {
    async send(msg) {
      await push(msg, { identity: Identity.stamp() });
    },
  };
}
