import { openaiCompatibleText } from "@tanstack/ai-openai/compatible";
import type { AgentConfig } from "../config";
import type { ModelPort } from ".";

export function litellm(config: AgentConfig): ModelPort {
  let listed: Promise<{ ids: string[]; default: string }> | undefined;
  const list = async () => {
    const res = await fetch(`${config.inference.url}/models`, {
      headers: { authorization: `Bearer ${config.inference.key}` },
    }).catch(() => undefined);
    const body = res?.ok
      ? ((await res.json().catch(() => undefined)) as { data: { id: string }[] } | undefined)
      : undefined;
    if (!body) {
      listed = undefined;
      return { ids: config.inference.models, default: config.inference.fallback };
    }
    const ids = body.data.map((model) => model.id).sort();
    return {
      ids: ids.includes(config.inference.fallback) ? ids : [config.inference.fallback, ...ids],
      default: config.inference.fallback,
    };
  };
  return {
    list() {
      listed ??= list();
      return listed;
    },
    text(model) {
      return openaiCompatibleText(model ?? config.inference.fallback, {
        baseURL: config.inference.url,
        apiKey: config.inference.key,
        strictFallbackWarning: false,
      });
    },
  };
}
