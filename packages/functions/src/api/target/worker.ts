import type { ExecutionContext } from "@cloudflare/workers-types";
import { Database } from "@template/core/drizzle";
import { app } from "../routes";

interface Env {
  Hyperdrive: { connectionString: string };
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return Database.provide(env.Hyperdrive.connectionString, () => app.fetch(request, env, ctx));
  },
};
