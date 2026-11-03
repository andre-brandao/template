# features/agent

The dashboard's AI agents, self-contained in this slice. Each agent is plain TanStack AI code:
one `chat()` call built from the shared blocks in `api/core.ts`, returning the stream. Only
the DDL (`conversation`, `conversation_message`) lives in core, at
`@template/core/conversation/conversation.sql`, because `drizzle.config.ts` globs core alone.

## Layout

- `api/core.ts` — `Agent`, the building blocks: `config`, `models`, `adapter` (the LiteLLM
  proxy through `@tanstack/ai-openai/compatible`), `mcp` (the app's MCP as a token's owner),
  the shared `prompt` and `offline` prompts, the `recorder` middleware, and the `Run` ids.
- `api/tools.ts` — `loose()` and the `relax` middleware. The gateway rejects strict-mode tool
  schemas; every tool of a run (MCP and browser included) goes out with an open root.
- `api/conversation.ts` — `Conversation`: `record`, `list`, `fromID`, `remove`, always the
  actor's own threads. `agent` is free text, so a new agent needs no migration.
- `api/agents.ts` — the registry: `export const agents = { copilot }`.
- `api/<name>/agent.ts` — one folder per agent, a function that calls `chat()` directly with
  its own persona, tools, MCP access and `Agent.recorder({ agent: "<name>", thread })`.
- `api/copilot/` — the dashboard copilot, plus its admin-only server tools: `sql.ts` (`Sql`,
  read-only SQL over a table→resource allowlist, a 20-row sample for the model) and
  `panel.ts` (`Panel`, saved json-render specs in Storage under `panels/`).
- `api/serve.ts` — the SSE endpoint behind `routes/(app)/agent/+server.ts`. Reads
  `forwardedProps` (`page`, `thread`, `model`) and forwards the session cookie as the MCP
  bearer, so every MCP call runs as the signed-in user.
- `agent.svelte.ts` — `createAgent` (root layout context), `agent()`, and
  `pageTools(list, views)`: client tools a mounted component declares for as long as it lives.
- `components/Dock.svelte` — the drawer and its open button. `routes/+layout.svelte` composes it
  into the Shell through its `side` snippet; shared layout never imports a feature.
- `ask/` — the `ask` page tool: a json-render form catalog, answered in the chat.
- `panel/` — the `panel` page tool (admins): blocks run their own SQL in the browser.

## Add an agent

A folder `api/<name>/agent.ts` exporting a function that calls `chat()` with the blocks in
`Agent`, plus a line in `api/agents.ts`. Small repetition between agents is fine. Record it
with `Agent.recorder({ agent: "<name>", thread })`; list its history with
`Conversation.list({ agent: "<name>" })`.

## Subagents

A specialist another agent delegates to is wrapped with TanStack's `defineAgent` and passed
via `chat({ subagents })`; its function takes `Agent.Run` so `run(ctx)` spreads the ids in.
Parent middleware does not reach a child, so it keeps its own recorder.

## Boundary

- The actor is captured inside the request (`AsyncLocalStorage.snapshot()` in server tools):
  the stream is consumed after the handler returns.
- A failed record is logged and dropped; it never breaks the user's stream.
- Tests never reach an LLM or the MCP.

Env: `LLM_URL`, `LLM_KEY`, `LLM_MODEL`, and `MCP_URL` (without it the agent runs offline).
