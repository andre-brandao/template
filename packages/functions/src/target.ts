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
        // Fresh pool per request: Workers forbid reusing a socket across them.
        Database.provider(Database.connect(env.Hyperdrive.connectionString)),
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
    .use(providers(Database.provider(Database.connect()), ...extra))
    .route("/", app);
  return process.env.SST_LIVE ? handle(aws) : streamHandle(aws);
}

/**
 * Bun dev server — one pool for the process, unless PG_RELEASE=true cycles it per
 * request: pglite allows a single connection and the other dev processes (dashboard,
 * auth) need it back. `scripts/dev.ts` sets it for the pglite driver.
 */
export function bun(app: App, port: number, ...extra: Context.Provider<Res>[]) {
  const shared = process.env.PG_RELEASE === "true" ? undefined : Database.connect();
  return {
    port,
    fetch: async (req: Request) => {
      const db = shared ?? Database.connect();
      try {
        return await Context.withProviders(() => app.fetch(req), Database.provider(db), ...extra);
      } finally {
        if (!shared) await Database.release(db);
      }
    },
  };
}
