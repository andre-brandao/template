import type { ExecutionContext } from "@cloudflare/workers-types";
import { Context } from "@template/core/context";
import { Database } from "@template/core/drizzle";
import type { Env } from "../../cf";
import { app } from "../index";

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return Context.withProviders(
      () => app.fetch(request, env, ctx),
      Database.provider(env.Hyperdrive.connectionString),
    );
  },
};
