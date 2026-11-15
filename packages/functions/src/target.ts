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

/** Cloudflare worker entry — db from the Hyperdrive binding, the rest from `extra(env)`. */
export function worker<E extends Env>(
  app: App,
  extra: (env: E) => Context.Provider<Res>[] = () => [],
) {
  return {
    async fetch(request: Request, env: E, ctx: ExecutionContext) {
      // Fresh pool per request: Workers forbid reusing a socket across them.
      const db = Database.connect(env.Hyperdrive.connectionString, { max: 5 });
      const res = await Context.withProviders(
        () => app.fetch(request, env, ctx),
        Database.provider(db),
        ...extra(env),
      );
      // Closed once the body is sent: a streamed MCP reply still queries while it flows.
      if (!res.body) {
        ctx.waitUntil(Database.release(db));
        return res;
      }
      const pipe = new TransformStream();
      ctx.waitUntil(res.body.pipeTo(pipe.writable).finally(() => Database.release(db)));
      return new Response(pipe.readable, res);
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

/** Bun dev server — one pool for the process. */
export function bun(app: App, port: number, ...extra: Context.Provider<Res>[]) {
  const db = Database.connect();
  return {
    port,
    fetch: (req: Request) =>
      Context.withProviders(() => app.fetch(req), Database.provider(db), ...extra),
  };
}
