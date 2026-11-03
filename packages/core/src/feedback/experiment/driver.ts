import { Context } from "../../context";
import { feedback } from "./adapter/feedback";
import type { Adapter } from "./port";

/** Adding a backend: one file under `adapter/`, one entry here. */
const adapters: Record<string, () => Adapter> = { feedback };

const ctx = Context.port(() => fromEnv(process.env));
export const provide = ctx.provide;
export const use = ctx.use;

/** `EXPERIMENT_ADAPTER`, default `feedback`. */
export function fromEnv(env: Record<string, string | undefined>): Adapter {
  const name = env.EXPERIMENT_ADAPTER ?? "feedback";
  const make = adapters[name];
  if (!make) throw new Error(`Unknown EXPERIMENT_ADAPTER: ${name}`);
  return make();
}
