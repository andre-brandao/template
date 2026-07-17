import type { KVNamespace, ExecutionContext } from "@cloudflare/workers-types";
import { CloudflareStorage } from "@openauthjs/openauth/storage/cloudflare";
import { Context } from "@template/core/context";
import { Database } from "@template/core/drizzle";
import { Email } from "@template/core/email";
import { createCloudflareSender } from "@template/core/email/adapter/cloudflare";
import { createAuth } from "../index";

interface Env {
  AuthKv: KVNamespace;
  Hyperdrive: { connectionString: string };
  SEND_EMAIL: { send(message: Record<string, unknown>): Promise<unknown> };
}

let app: ReturnType<typeof createAuth> | null = null;

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    if (!app) app = createAuth(CloudflareStorage({ namespace: env.AuthKv }));
    return Context.withProviders(
      () => app!.fetch(request, env, ctx),
      Database.provider(env.Hyperdrive.connectionString),
      Email.provider(createCloudflareSender(env.SEND_EMAIL)),
    );
  },
};
