import { Context } from "@template/core/context";

export type AgentConfig = {
  inference: {
    url: string;
    key: string;
    models: string[];
    fallback: string;
    claudeKey?: string;
    codexKey?: string;
  };
  sandbox: {
    runtime: "docker" | "cloudflare";
    image: string;
    network?: string;
    ttl: number;
  };
};

export type AgentResolver = {
  resolve(input: { profile: string; thread: string }): Promise<AgentConfig>;
};

function required(env: Record<string, string | undefined>, key: string) {
  const value = env[key];
  if (!value) throw new Error(`Agent needs ${key}`);
  return value;
}

export function fromEnv(env: Record<string, string | undefined>): AgentConfig {
  const fallback = required(env, "LLM_MODEL");
  const models = (env.LLM_MODELS ?? fallback)
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);
  const ttl = Number(env.AGENT_TTL ?? 3_600_000);
  if (!Number.isSafeInteger(ttl) || ttl <= 0) throw new Error("AGENT_TTL must be positive");
  return {
    inference: {
      url: required(env, "LLM_URL").replace(/\/$/, ""),
      key: required(env, "LLM_KEY"),
      models: models.includes(fallback) ? models : [fallback, ...models],
      fallback,
      claudeKey: env.LLM_CLAUDE_KEY,
      codexKey: env.LLM_CODEX_KEY,
    },
    sandbox: {
      runtime: env.AGENT_SANDBOX === "cloudflare" ? "cloudflare" : "docker",
      image: env.AGENT_IMAGE ?? "template/agent:latest",
      network: env.AGENT_NETWORK,
      ttl,
    },
  };
}

export const ready = (env: Record<string, string | undefined>) =>
  !!(env.LLM_URL && env.LLM_KEY && env.LLM_MODEL);

export namespace AgentContext {
  const port = Context.port<AgentResolver>(() => {
    const config = fromEnv(process.env);
    return { resolve: async () => config };
  });

  export const use = port.use;
  export const provide = port.provide;
  export const provider = port.provider;
}
