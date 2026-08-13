import type { ExecutionContext } from "@cloudflare/workers-types";
import { Context } from "@template/core/context";
import { Database } from "@template/core/drizzle";
import { Queue } from "@template/core/queue";
import type { QueueEnv } from "../../cf";
import { app } from "../index";

// Hand-rolled rather than the `worker()` helper — the queue binding (`env.Jobs`) is
// only available per-request, same reason `api/target/worker.ts` does this.
export default {
  // fallow-ignore-next-line code-duplication
  fetch(request: Request, env: QueueEnv, ctx: ExecutionContext) {
    return Context.withProviders(
      () => app.fetch(request, env, ctx),
      Database.provider(Database.create(env.Hyperdrive.connectionString)),
      Queue.provider(Queue.Providers.cloudflare(env.Jobs)),
    );
  },
};
