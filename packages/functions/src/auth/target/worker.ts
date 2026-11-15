import type { ExecutionContext } from "@cloudflare/workers-types";
import { CloudflareStorage } from "@openauthjs/openauth/storage/cloudflare";
import type { AuthEnv } from "../../cf";
import { createAuth } from "../index";

let app: ReturnType<typeof createAuth> | null = null;

// Stateless toward apps: no Hyperdrive, no mail — only its own KV.
export default {
  async fetch(request: Request, env: AuthEnv, ctx: ExecutionContext) {
    app ??= createAuth(CloudflareStorage({ namespace: env.AuthKv }));
    return app.fetch(request, env, ctx);
  },
};
