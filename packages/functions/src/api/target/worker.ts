import type { ExecutionContext } from "@cloudflare/workers-types";
import { Context } from "@template/core/context";
import { Database } from "@template/core/drizzle";
import { Queue } from "@template/core/queue";
import { Storage } from "@template/core/storage";
import type { QueueEnv } from "../../cf";
import { app } from "../routes";

// Hand-rolled rather than the `worker()` helper — the R2 and queue bindings
// (`env.Files`, `env.Jobs`) are only available per-request, same reason
// `auth/target/worker.ts` does this for its `SEND_EMAIL` binding.
export default {
  // fallow-ignore-next-line code-duplication
  fetch(request: Request, env: QueueEnv, ctx: ExecutionContext) {
    return Context.withProviders(
      () => app.fetch(request, env, ctx),
      Database.provider(Database.connect(env.Hyperdrive.connectionString)),
      Storage.provider(Storage.Providers.r2(env.Files)),
      Queue.provider(Queue.Providers.cloudflare(env.Jobs)),
    );
  },
};
