import { claudeCodeText } from "@tanstack/ai-claude-code";
import { codexText } from "@tanstack/ai-codex";
import type { AgentConfig } from "../config";

type ClaudeOptions = NonNullable<Parameters<typeof claudeCodeText>[1]>;
type CodexOptions = NonNullable<Parameters<typeof codexText>[1]>;

export namespace Harness {
  export function Claude(
    config: AgentConfig,
    input: Omit<ClaudeOptions, "authMode" | "env"> & { model: string },
  ) {
    const { model, ...options } = input;
    return claudeCodeText(model, {
      ...options,
      authMode: "api-key",
      env: {
        ANTHROPIC_BASE_URL: config.inference.url,
        ANTHROPIC_AUTH_TOKEN: config.inference.claudeKey ?? config.inference.key,
        ENABLE_TOOL_SEARCH: "true",
      },
    });
  }

  export function Codex(
    config: AgentConfig,
    input: Omit<CodexOptions, "authMode" | "config" | "env"> & { model: string },
  ) {
    const { model, ...options } = input;
    const url = config.inference.url.endsWith("/v1")
      ? config.inference.url
      : `${config.inference.url}/v1`;
    return codexText(model, {
      ...options,
      authMode: "api-key",
      env: {
        CODEX_API_KEY: config.inference.codexKey ?? config.inference.key,
      },
      config: {
        model_provider: '"litellm"',
        "model_providers.litellm.name": '"LiteLLM"',
        "model_providers.litellm.base_url": `"${url}"`,
        "model_providers.litellm.env_key": '"CODEX_API_KEY"',
        "model_providers.litellm.wire_api": '"responses"',
      },
    });
  }
}
