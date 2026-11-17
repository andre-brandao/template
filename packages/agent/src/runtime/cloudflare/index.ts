import { cloudflareSandbox } from "@tanstack/ai-sandbox-cloudflare";
import { createCloudflareSandboxAgent } from "@tanstack/ai-sandbox-cloudflare/agent";

export namespace Cloudflare {
  export const make = cloudflareSandbox;
  export const agent = createCloudflareSandboxAgent;
}

export type { SandboxAgentEnv } from "@tanstack/ai-sandbox-cloudflare/agent";
