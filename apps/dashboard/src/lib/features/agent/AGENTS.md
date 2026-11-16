# features/agent

The dashboard's AI agents, self-contained in this slice. Each agent is plain TanStack AI code:
one `chat()` call built from the shared blocks in `api/core.ts`, returning the stream. What
persists lives in core: `Conversation` (`@template/core/conversation`) and `Panel`
(`@template/core/panel`).

## Layout

- `api/core.ts` — `Agent`, the building blocks: `config`, `models`, `adapter` (the LiteLLM
  proxy through `@tanstack/ai-openai/compatible`), `mcp` (the app's MCP as a token's owner)
  and `attach` (its run option, or the offline prompt), the shared `prompt` and `offline`
  prompts, the `recorder` middleware (`tail` + `entry`), and the `Run` ids.
- `api/tools.ts` — `loose()` and the `relax` middleware. The gateway rejects strict-mode tool
  schemas; every tool of a run (MCP and browser included) goes out with an open root.
- Core's `Conversation`: `record`, `list`, `fromID`, `remove`, always the actor's own threads.
  `agent` is free text, so a new agent needs no migration.
- `api/agents.ts` — the registry: `export const agents = { orchestrator, panel }`.
- `api/<name>/agent.ts` — one folder per agent, a function that calls `chat()` directly with
  its own persona, tools, MCP access and `Agent.recorder({ agent: "<name>", thread })`.
- `api/orchestrator/` — the dashboard orchestrator: the MCP, the page tools, and for admins
  the `panel` subagent plus its `delegate` prompt.
- `api/panel/` — the `panel` subagent (admins only, `undefined` for anyone else), plus its
  server tools: `sql.ts` (`Sql`, read-only SQL over a table→resource allowlist, a 20-row
  sample for the model). Saved specs go through core's `Panel` (`@template/core/panel`, one
  JSON per panel in Storage under `panels/<userID>/`). Its `draft` tool checks a spec
  server-side; the last ok one is its result.
- `api/serve.ts` — the SSE endpoint behind `routes/(app)/agent/+server.ts`. Records under
  the AG-UI `threadId`, reads `forwardedProps` (`page`, `model`) and mints a short-lived
  `orchestrator` delegation (`agt-`) per request as the MCP bearer, so every MCP call runs as
  orchestrator-for-the-user. The session never leaves the dashboard.
- `api/<slice>.query.ts` — TanStack factories over the remote functions (`agent`: models and
  history; `panel`: saved panels and a block's rows), with plain array keys.
- `agent.svelte.ts` — `createAgent` (root layout context) and `agent()`. A chat's `threadId`
  is the conversation, so a new or resumed one swaps in a new chat. `Agent.svelte` equips
  it with its page tools (`page.ts`, `ask/`, `panel/`) and their views.
- `components/Dock.svelte` — the drawer, Mod+J to toggle and Escape to close.
  `routes/+layout.svelte` composes it into the Shell through its `side` snippet; shared layout
  never imports a feature.
- `components/Message.svelte` — a subagent part renders as its steps (a recursive snippet)
  under the tool call that started it; a reloaded transcript keeps only the call's chip.
- `render/` — what `ask` and `panel` share: the Card, Row and Text blocks, `clean`, and the
  catalog helpers (`shape`, `describe`, `verify`). Neither imports the other.
- `ask/` — the `ask` page tool: a json-render form catalog, answered in the chat.
- `panel/` — the `show` page tool (admins): draws the spec `panel` returned, blocks running
  their own SQL in the browser. `check.ts` is shared with `draft`, over another row source.
- `pages/` — `PanelsPage` and `PanelPage`, the saved panels, rendered at `/settings/panels`.

## Add an agent

A folder `api/<name>/agent.ts` exporting a function that calls `chat()` with the blocks in
`Agent`, plus a line in `api/agents.ts`. Small repetition between agents is fine. Record it
with `Agent.recorder({ agent: "<name>", thread })`; list its history with
`Conversation.list({ agent: "<name>" })`.

## Subagents

A specialist another agent delegates to is a factory returning TanStack's `defineAgent`,
built inside the request and passed via `chat({ subagents: { agents: [child] } })`;
`run(ctx)` spreads `ctx.forward` into its own `chat()`.

- Parent middleware does not reach a child, so it keeps its own recorder, on its own thread
  (`<thread>/<subagentRunId>`): a child's messages never land in the parent's conversation.
- A child gets no browser tools. It hands data back as `RUN_FINISHED.result`, which the parent
  model gets instead of the child's text; the parent passes it on to a page tool.
- The synthetic tool is named after the agent, so no page tool may share that name.

## Boundary

- The actor is captured inside the request (`AsyncLocalStorage.snapshot()` in server tools):
  the stream is consumed after the handler returns.
- A failed record is logged and dropped; it never breaks the user's stream.
- Tests never reach an LLM or the MCP.

Env: `LLM_URL`, `LLM_KEY`, `LLM_MODEL`, and `MCP_URL` (without it the agent runs offline).
