import type { ExecutionContext } from "@cloudflare/workers-types";
import { Database } from "@template/core/drizzle";
import type { Env } from "../../cf";
import { app } from "../routes";

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return Database.provide(env.Hyperdrive.connectionString, () => app.fetch(request, env, ctx));
  },
};
