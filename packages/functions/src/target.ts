import { Hono } from "hono";
import type { Env as HonoEnv, Schema } from "hono";
import { handle, streamHandle } from "hono/aws-lambda";
import type { ExecutionContext } from "@cloudflare/workers-types";
import { Context } from "@template/core/context";
import { Database } from "@template/core/drizzle";
import type { Env } from "./cf";
import { providers } from "./providers";

type App = Pick<Hono, "fetch">;
type Res = Response | Promise<Response>;

/** Cloudflare worker entry — db from the Hyperdrive binding. */
export function worker(app: App, ...extra: Context.Provider<Res>[]) {
  return {
    fetch(request: Request, env: Env, ctx: ExecutionContext) {
      return Context.withProviders(
        () => app.fetch(request, env, ctx),
        Database.provider(env.Hyperdrive.connectionString),
        ...extra,
      );
    },
  };
}

/** Lambda entry — db from env; streams unless running in sst dev's live lambda. */
export function lambda<E extends HonoEnv, S extends Schema, P extends string>(
  app: Hono<E, S, P>,
  ...extra: Context.Provider<Promise<void>>[]
) {
  const aws = new Hono()
    .use(providers(Database.provider(process.env.DATABASE_URL ?? Database.DEFAULT_URL), ...extra))
    .route("/", app);
  return process.env.SST_LIVE ? handle(aws) : streamHandle(aws);
}

/**
 * Bun dev server — db from env, released after each request: pglite allows only
 * one connection and other dev processes (dashboard, auth) need it back.
 */
export function bun(app: App, port: number, ...extra: Context.Provider<Res>[]) {
  const url = process.env.DATABASE_URL ?? Database.DEFAULT_URL;
  return {
    port,
    fetch: async (req: Request) => {
      try {
        return await Context.withProviders(
          () => app.fetch(req),
          Database.provider(url),
          ...extra,
        );
      } finally {
        await Database.release(url);
      }
    },
  };
}
