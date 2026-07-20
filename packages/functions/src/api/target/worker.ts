import type { ExecutionContext } from "@cloudflare/workers-types";
import { Context } from "@template/core/context";
import { Database } from "@template/core/drizzle";
import { File } from "@template/core/file";
import { createR2Storage } from "@template/core/file/adapter/r2";
import type { Env } from "../../cf";
import { app } from "../routes";

// Hand-rolled rather than the `worker()` helper — the R2 binding (`env.Files`)
// is only available per-request, same reason `auth/target/worker.ts` does this
// for its `SEND_EMAIL` binding.
export default {
  // fallow-ignore-next-line code-duplication
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return Context.withProviders(
      () => app.fetch(request, env, ctx),
      Database.provider(env.Hyperdrive.connectionString),
      File.provider(createR2Storage(env.Files)),
    );
  },
};
