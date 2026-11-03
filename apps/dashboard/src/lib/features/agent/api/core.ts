import type { ChatMiddleware, ModelMessage, TextOptions } from "@tanstack/ai";
import { openaiCompatibleText } from "@tanstack/ai-openai/compatible";
import { createMCPClient } from "@tanstack/ai-mcp";
import { Log } from "@template/core/util/log";
import { Conversation } from "./conversation";

type Env = Record<string, string | undefined>;

const log = Log.create({ namespace: "agent" });

/** The building blocks every agent's `chat()` is made of. */
export namespace Agent {
  /**
   * The run ids a `chat()` takes, named as TanStack names them, so a subagent's `run(ctx)`
   * can spread its ctx straight into an agent.
   */
  export type Run = Pick<
    TextOptions,
    "threadId" | "runId" | "parentRunId" | "subagentRunId" | "resume"
  >;

  /** Shared by every agent, ahead of its own prompt. */
  export const prompt = `This app tracks projects and their todos. Use the tools to read its data instead of guessing; if a tool denies access, say the user lacks permission.`;

  /** For a run whose MCP didn't come up. */
  export const offline = `The data tools are unavailable right now. If the question depends on the app's data, say so instead of answering from memory.`;

  /** The LLM proxy and the MCP. Without `MCP_URL` the agent gets no MCP. */
  export function config(env: Env = process.env) {
    if (!env.LLM_URL || !env.LLM_KEY || !env.LLM_MODEL)
      throw new Error("Agent needs LLM_URL, LLM_KEY and LLM_MODEL");
    return { url: env.LLM_URL, key: env.LLM_KEY, model: env.LLM_MODEL, mcp: env.MCP_URL };
  }

  /** Models the LiteLLM proxy serves; the default alone when it can't be listed. */
  export async function models(env?: Env) {
    const cfg = config(env);
    const res = await fetch(`${cfg.url}/models`, {
      headers: { authorization: `Bearer ${cfg.key}` },
    }).catch(() => undefined);
    if (!res?.ok) return { ids: [cfg.model], default: cfg.model };
    const body = (await res.json()) as { data: { id: string }[] };
    const ids = body.data.map((model) => model.id).sort();
    return { ids: ids.includes(cfg.model) ? ids : [cfg.model, ...ids], default: cfg.model };
  }

  /** The LiteLLM proxy as a TanStack text adapter, on `model` or the default. */
  export function adapter(model?: string, env?: Env) {
    const cfg = config(env);
    return openaiCompatibleText(model ?? cfg.model, { baseURL: cfg.url, apiKey: cfg.key });
  }

  /**
   * The app's MCP as the owner of `token`, so every tool call runs as them. Undefined
   * without `MCP_URL` or when it is unreachable.
   */
  export async function mcp(token: string, opts?: { readonly?: boolean }, env?: Env) {
    const url = config(env).mcp;
    if (!url) return undefined;
    return createMCPClient({
      transport: { type: "http", url, headers: { authorization: `Bearer ${token}` } },
      // Hints, not a boundary: the MCP still checks every call against the token's role.
      toolFilter: opts?.readonly ? (tool) => tool.annotations?.readOnlyHint === true : undefined,
    }).catch((err) => {
      log.warn(`MCP unreachable at ${url}`, { error: String(err) });
      return undefined;
    });
  }

  /** A run's `mcp` option for `client`, or the offline prompt when it didn't come up. */
  export function attach(client: Awaited<ReturnType<typeof mcp>>) {
    if (!client) return { mcp: undefined, prompts: [offline] };
    // Closed when the run ends, on success, error or abort.
    return { mcp: { clients: [client] }, prompts: [] };
  }

  /** The input messages new to this run: whatever follows the last assistant message. */
  export function tail(messages: ReadonlyArray<ModelMessage>) {
    return messages.slice(messages.findLastIndex((message) => message.role === "assistant") + 1);
  }

  /** A model message as `Conversation.record` takes it. */
  export function entry(message: ModelMessage) {
    return {
      role: message.role,
      content: message,
      text:
        typeof message.content === "string"
          ? message.content
          : (message.content ?? [])
              .flatMap((part) => (part.type === "text" ? [part.content] : []))
              .join("") || null,
      tools: (message.toolCalls ?? []).map((call) => call.function.name),
    };
  }

  /**
   * Records each run: the new input messages plus what the run produced. By `onFinish` the
   * engine has appended the produced assistant and tool messages to `ctx.messages`.
   */
  export function recorder(input: { agent: string; thread: string }): ChatMiddleware {
    const state = {
      start: undefined as ReadonlyArray<ModelMessage> | undefined,
      tokensIn: 0,
      tokensOut: 0,
    };
    // A failed record is logged and dropped; it never breaks the user's stream.
    const save = (
      messages: ReadonlyArray<ModelMessage>,
      run: { id: string; model: string; durationMs: number; error?: string },
    ) =>
      messages.length
        ? Conversation.record({
            agent: input.agent,
            thread: input.thread,
            run: { ...run, tokensIn: state.tokensIn, tokensOut: state.tokensOut },
            messages: messages.map(entry),
          })
            .then(() => undefined)
            .catch((err) =>
              log.warn("conversation not recorded", { thread: input.thread, error: String(err) }),
            )
        : Promise.resolve();
    // A run that fails before `onStart` still has its converted input on `ctx.messages`.
    const made = (messages: ReadonlyArray<ModelMessage>) => {
      const start = state.start ?? messages;
      return [...tail(start), ...messages.slice(start.length)];
    };
    return {
      name: "recorder",
      onStart: (ctx) => {
        state.start = ctx.messages;
      },
      onUsage: (_ctx, usage) => {
        state.tokensIn += usage.promptTokens;
        state.tokensOut += usage.completionTokens;
      },
      onFinish: (ctx, info) =>
        ctx.defer(
          save(made(ctx.messages), { id: ctx.runId, model: ctx.model, durationMs: info.duration }),
        ),
      onAbort: (ctx, info) =>
        ctx.defer(
          save(made(ctx.messages), { id: ctx.runId, model: ctx.model, durationMs: info.duration }),
        ),
      onError: (ctx, info) =>
        ctx.defer(
          save(tail(state.start ?? ctx.messages), {
            id: ctx.runId,
            model: ctx.model,
            durationMs: info.duration,
            error: info.error instanceof Error ? info.error.message : String(info.error),
          }),
        ),
    };
  }
}
