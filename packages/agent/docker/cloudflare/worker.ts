// fallow-ignore-file unused-file

import type { AgentConfig } from "../../src/config";
import { Cloudflare, type SandboxAgentEnv } from "../../src/runtime/cloudflare";
import { Harness, Sandbox, Workspace } from "../../src/sandbox";

interface Env extends SandboxAgentEnv {
  LLM_URL: string;
  LLM_KEY: string;
  LLM_CLAUDE_KEY?: string;
  LLM_CODEX_KEY?: string;
}

function text(metadata: Record<string, unknown> | undefined, key: string) {
  const value = metadata?.[key];
  if (typeof value !== "string" || !value) throw new Error(`metadata.${key} is required`);
  return value;
}

function config(env: Env, model: string): AgentConfig {
  return {
    inference: {
      url: env.LLM_URL.replace(/\/$/, ""),
      key: env.LLM_KEY,
      models: [model],
      fallback: model,
      claudeKey: env.LLM_CLAUDE_KEY,
      codexKey: env.LLM_CODEX_KEY,
    },
    sandbox: {
      runtime: "cloudflare",
      image: "binding",
      ttl: 3_600_000,
    },
  };
}

const agent = Cloudflare.agent<Env>({
  adapter(input, env) {
    const harness = text(input.metadata, "harness");
    const model = text(input.metadata, "model");
    if (harness === "claude") return Harness.Claude(config(env, model), { model });
    if (harness === "codex") return Harness.Codex(config(env, model), { model });
    throw new Error(`Unsupported harness: ${harness}`);
  },
  sandbox(input, env) {
    const userId = input.metadata?.userId;
    return Sandbox.make({
      id: text(input.metadata, "sandbox"),
      tenant: typeof userId === "string" ? { userId } : undefined,
      provider: Cloudflare.make({ binding: env.Sandbox }),
      workspace: Workspace.make({
        source: Workspace.github({
          repo: text(input.metadata, "repo"),
          ref: typeof input.metadata?.ref === "string" ? input.metadata.ref : undefined,
        }),
      }),
      lifecycle: { keepAlive: "30m" },
    });
  },
  stallTimeoutMs: 10 * 60_000,
});

export const RunCoordinator = agent.Coordinator;
export const SandboxContainer = agent.Sandbox;
export default agent.worker;
