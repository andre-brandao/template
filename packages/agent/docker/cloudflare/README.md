# Cloudflare sandbox agent

This Worker runs Claude Code and Codex in Cloudflare Sandbox Containers. TanStack's coordinator
Durable Object owns each run and its replayable event log.

## Configuration

Set non-secret deployment configuration:

```sh
bunx wrangler -c packages/agent/docker/cloudflare/wrangler.jsonc secret put LLM_URL
```

Set one scoped LiteLLM key for each path:

```sh
bunx wrangler -c packages/agent/docker/cloudflare/wrangler.jsonc secret put LLM_KEY
bunx wrangler -c packages/agent/docker/cloudflare/wrangler.jsonc secret put LLM_CLAUDE_KEY
bunx wrangler -c packages/agent/docker/cloudflare/wrangler.jsonc secret put LLM_CODEX_KEY
```

`LLM_CODEX_KEY` must be allowed to call the LiteLLM OpenAI-compatible Responses API. Do not use a
LiteLLM master key or an upstream OpenAI key.

## Start a Codex run

```ts
const response = await fetch("https://template-agent.example.workers.dev/runs", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    threadId: "chat-a",
    messages: [{ role: "user", content: "Fix the failing tests." }],
    metadata: {
      sandbox: "workspace-42",
      userId: "user-01",
      harness: "codex",
      model: "coding-codex",
      repo: "owner/repo",
      ref: "dev",
    },
  }),
});

const { runId } = (await response.json()) as { runId: string };
```

`sandbox` selects the shared workspace. Multiple `threadId` values can use the same sandbox and
therefore the same checkout while keeping independent chat histories.

Tail the durable run log over WebSocket:

```ts
const url = new URL(`/runs/${runId}/stream`, "https://template-agent.example.workers.dev");
url.protocol = "wss:";
url.searchParams.set("threadId", "chat-a");
url.searchParams.set("lastSeq", "-1");
const socket = new WebSocket(url);
```

Cloudflare cannot signal a process inside its Sandbox Container. Cancellation must use the
TanStack coordinator cancellation route so the container is destroyed; closing the WebSocket only
detaches the viewer.
