import { Context } from "../context";
import { Log } from "../util/log";
import { github } from "./adapter/github";
import { memory } from "./adapter/memory";
import type { Adapter } from "./port";

const log = Log.create({ namespace: "core.feedback" });

// Env fallback, cached, so the memory tracker and the github caches outlive one call.
const ctx = Context.port(() => fromEnv(process.env));
export const provide = ctx.provide;
export const use = ctx.use;

/** `FEEDBACK_ADAPTER=github|memory`; github when `FEEDBACK_TOKEN` is set, memory otherwise. */
export function fromEnv(env: Record<string, string | undefined>): Adapter {
  const name = env.FEEDBACK_ADAPTER ?? (env.FEEDBACK_TOKEN ? "github" : "memory");
  log.info("using feedback adapter", { name });
  if (name === "memory") return memory();
  if (name !== "github") throw new Error(`Unknown FEEDBACK_ADAPTER: ${name}`);
  if (!env.FEEDBACK_TOKEN || !env.FEEDBACK_REPO)
    throw new Error("FEEDBACK_ADAPTER=github needs FEEDBACK_TOKEN and FEEDBACK_REPO");
  return github({ token: env.FEEDBACK_TOKEN, repo: env.FEEDBACK_REPO });
}
