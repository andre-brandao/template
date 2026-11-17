# agent

TanStack AI composition for direct assistants and sandbox coding agents.

- `src/model` owns inference gateway configuration and contextual model adapters.
- `src/assistant` contains helpers shared by ordinary `chat()` assistants.
- `src/sandbox` composes TanStack harnesses, workspaces, and providers directly.
- `src/runtime/docker` is Bun/Docker-only.
- `src/runtime/cloudflare` is Worker/Container-only.
- Keep provider SDK imports in runtime subpaths so consumers do not bundle unused runtimes.
- Core remains a leaf; this package may import core, never the reverse.
- LiteLLM is an inference gateway, not an agent runtime.
- Never inject upstream provider keys or LiteLLM master keys into a sandbox.
