import type { MiddlewareHandler } from "hono";
import { Context } from "@template/core/context";

/** Runs each request inside the given contexts, e.g. `providers(Database.provider(url))`. */
export function providers(...list: Context.Provider<Promise<void>>[]): MiddlewareHandler {
  return (_, next) => Context.withProviders(next, ...list);
}
