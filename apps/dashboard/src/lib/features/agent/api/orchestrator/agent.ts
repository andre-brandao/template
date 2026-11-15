import {
  chat,
  type AnyTool,
  type MergedAgentTools,
  type ModelMessage,
  type UIMessage,
} from "@tanstack/ai";
import { Agent } from "../core";
import { delegate, panel } from "../panel/agent";
import { entry, relax, type Source } from "../tools";

const persona = `You are the Assistant inside the dashboard. Answer short and direct.
When you need a decision or details from the user before acting, use \`ask\` with a recommended answer instead of asking in text. Put everything you need to know now into one call.
After you create, change or remove data, call \`refresh\` so the user's page shows it.`;

/** What a run calls beyond the page tools: the MCP as `token`'s owner and, for admins, `panel`. */
async function kit(input: { token: string; thread: string; model?: string }) {
  return {
    client: await Agent.mcp(input.token),
    child: panel({ thread: input.thread, model: input.model }),
  };
}

// TanStack's input for a subagent without an `inputSchema`.
const brief = { type: "object", properties: { prompt: { type: "string" } }, required: ["prompt"] };

/**
 * The server half of the orchestrator's tools, from the `kit` a run gets, so the Tools tab
 * lists the real set. A failed MCP is its group's error, never the whole list's.
 */
export async function listing(token: string) {
  const own = await kit({ token, thread: "tools" });
  const child = own.child;
  const app = child ? [entry("app", { ...child, inputSchema: child.inputSchema ?? brief })] : [];
  const client = own.client;
  // A string is why the MCP group is missing.
  const mcp = client
    ? await client
        .tools()
        .then(
          (list) => list.map((tool) => entry("mcp", tool)),
          (err) => (err instanceof Error ? err.message : String(err)),
        )
        .finally(() => client.close().catch(() => {}))
    : Agent.config().mcp
      ? "The MCP server is unreachable."
      : "No MCP server is set, so the agent runs offline.";
  const failed = typeof mcp === "string";
  return {
    tools: failed ? app : [...app, ...mcp],
    errors: { mcp: failed ? mcp : undefined } as Partial<Record<Source, string>>,
  };
}

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
  const own = await kit({ token: input.token, thread: input.threadId, model: input.model });
  const link = Agent.attach(own.client);
  const child = own.child;
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
