# @template/cli

One entrypoint to run and talk to the template.

```sh
bun run cli <command>        # from the repo root
# or, after `bun install` links the bin:
template-cli <command>
```

## Serve

```sh
template-cli serve api         # Hono API on PORT (default 3000)
template-cli serve mcp         # MCP server on MCP_PORT (default 3001), at /mcp
template-cli serve dashboard   # SvelteKit prod build on PORT (auto-builds if missing)
```

`serve api`/`serve mcp` reuse a single DB connection per request (like the dashboard's
`hooks.server.ts`), so they work against the local pglite dev DB as well as postgres.
They read `DATABASE_URL` (falling back to `Database.DEFAULT_URL`). For a local DB, start
one with `bun dev` or `bun scripts/pglite.ts`.

## API (built-in SDK)

The `api` command reflects the generated `@template/sdk`, so every endpoint is callable and
new ones show up automatically after `bun run gen`.

```sh
template-cli api                              # list callable methods
template-cli api getTodo                      # GET /todo
template-cli api postTodo --title "Ship it"   # POST /todo
template-cli api postTodo '{"title":"Ship"}'  # same, via a JSON blob
template-cli api getTodoById --id tod_123
```

Flags map to call params (`--key value`, `--key=value`, or bare `--flag` for `true`).
`--token` and `--url` override the saved config for a single call.

## Auth

```sh
template-cli login --email you@example.com --password ...
template-cli whoami
template-cli logout
```

`login` saves `{ token, url }` to `$XDG_CONFIG_HOME/template/config.json`
(`~/.config/template/config.json`). `api`/`whoami` use it automatically. Token resolution:
`--token` › `TEMPLATE_TOKEN` › saved config. Base URL: `--url` › `API_URL` › saved config ›
`http://localhost:3000`.

> The password prompt echoes — Bun has no built-in hidden input. Prefer `--password`.
