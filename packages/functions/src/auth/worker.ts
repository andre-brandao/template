import type { KVNamespace, ExecutionContext } from "@cloudflare/workers-types";
import { CloudflareStorage } from "@openauthjs/openauth/storage/cloudflare";
import { Database } from "@template/core/drizzle";
import { Email } from "@template/core/email";
import { createCloudflareSender } from "@template/core/email/adapter/cloudflare";
import { createAuth } from "./index";

interface Env {
  AuthKv: KVNamespace;
  Hyperdrive: { connectionString: string };
  SEND_EMAIL: { send(message: Record<string, unknown>): Promise<unknown> };
}

let app: ReturnType<typeof createAuth> | null = null;

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    if (!app) app = createAuth(CloudflareStorage({ namespace: env.AuthKv }));
    return Database.provide(env.Hyperdrive.connectionString, () =>
      Email.provide(createCloudflareSender(env.SEND_EMAIL), () => app!.fetch(request, env, ctx)),
    );
  },
};
