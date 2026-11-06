import {
  chat,
  type AnyTool,
  type MergedAgentTools,
  type ModelMessage,
  type UIMessage,
} from "@tanstack/ai";
import { Agent } from "../core";
import { relax } from "../tools";
import { Sql } from "./sql";

const persona = `You are the Assistant inside the dashboard. Answer short and direct.
When you need a decision or details from the user before acting, use \`ask\` with a recommended answer instead of asking in text. Put everything you need to know now into one call.
After you create, change or remove data, call \`refresh\` so the user's page shows it.`;

/**
 * The dashboard's copilot: the whole MCP as the signed-in user, the read-only SQL tools for
 * admins, plus the page tools the browser runs.
 */
export async function copilot(
  input: Agent.Run & {
    /** The conversation it is recorded under; `threadId` defaults to it. */
    thread: string;
    messages: Array<UIMessage | ModelMessage>;
    prompts?: string[];
    model?: string;
    token: string;
    tools?: MergedAgentTools<ReadonlyArray<AnyTool>>;
    abortController?: AbortController;
  },
  env?: Record<string, string | undefined>,
) {
  const link = Agent.attach(await Agent.mcp(input.token, {}, env));
  const sql = Sql.kit();
  return chat({
    adapter: Agent.adapter(input.model, env),
    messages: input.messages,
    threadId: input.threadId ?? input.thread,
    runId: input.runId,
    parentRunId: input.parentRunId,
    subagentRunId: input.subagentRunId,
    resume: input.resume,
    systemPrompts: [
      Agent.prompt,
      persona,
      ...sql.prompts,
      ...(input.prompts ?? []),
      ...link.prompts,
    ],
    tools: [...sql.tools, ...(input.tools ?? [])],
    mcp: link.mcp,
    middleware: [relax, Agent.recorder({ agent: "copilot", thread: input.thread })],
    abortController: input.abortController,
  });
}
