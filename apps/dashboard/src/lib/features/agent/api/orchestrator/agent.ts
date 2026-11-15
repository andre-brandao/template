import {
  chat,
  type AnyTool,
  type MergedAgentTools,
  type ModelMessage,
  type UIMessage,
} from "@tanstack/ai";
import { Agent } from "../core";
import { delegate, panel } from "../panel/agent";
import { relax } from "../tools";

const persona = `You are the Assistant inside the dashboard. Answer short and direct.
When you need a decision or details from the user before acting, use \`ask\` with a recommended answer instead of asking in text. Put everything you need to know now into one call.
After you create, change or remove data, call \`refresh\` so the user's page shows it.`;

/**
 * The dashboard's orchestrator: the whole MCP as the signed-in user, the page tools the browser
 * runs, and for admins the `panel` subagent.
 */
export async function orchestrator(
  input: Agent.Run & {
    messages: Array<UIMessage | ModelMessage>;
    prompts?: string[];
    model?: string;
    token: string;
    tools?: MergedAgentTools<ReadonlyArray<AnyTool>>;
    abortController?: AbortController;
  },
) {
  const link = Agent.attach(await Agent.mcp(input.token));
  const child = panel({ thread: input.threadId, model: input.model });
  return chat({
    adapter: Agent.adapter(input.model),
    messages: input.messages,
    threadId: input.threadId,
    runId: input.runId,
    parentRunId: input.parentRunId,
    subagentRunId: input.subagentRunId,
    resume: input.resume,
    systemPrompts: [
      Agent.prompt,
      persona,
      ...(child ? [delegate] : []),
      ...(input.prompts ?? []),
      ...link.prompts,
    ],
    tools: input.tools ?? [],
    mcp: link.mcp,
    subagents: child ? { agents: [child] } : undefined,
    middleware: [relax, Agent.recorder({ agent: "orchestrator", thread: input.threadId })],
    abortController: input.abortController,
  });
}
