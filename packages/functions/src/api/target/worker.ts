import type { ExecutionContext } from "@cloudflare/workers-types";
import { Context } from "@template/core/context";
import { Database } from "@template/core/drizzle";
import { Storage } from "@template/core/storage";
import { createR2Storage } from "@template/core/storage/adapter/r2";
import type { Env } from "../../cf";
import { app } from "../routes";

// Hand-rolled rather than the `worker()` helper — the R2 binding (`env.Files`)
// is only available per-request, same reason `auth/target/worker.ts` does this
// for its `SEND_EMAIL` binding.
export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return Context.withProviders(
      () => app.fetch(request, env, ctx),
      Database.provider(env.Hyperdrive.connectionString),
      Storage.provider(createR2Storage(env.Files)),
    );
  },
};
