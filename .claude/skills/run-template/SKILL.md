---
name: run-template
description: Build, run, and drive the template dev stack (dashboard, api, mcp, auth, cli). Use when asked to start the app, run the dev stack, take a screenshot of the dashboard, smoke-test the API/MCP/CLI, or confirm a change works in the running app.
---

Monorepo dev stack: `bun dev` boots postgres (docker), seeds it, then runs
four servers — api, mcp, auth (Hono/Bun from `packages/functions`) and the
SvelteKit dashboard (`apps/dashboard`). Drive the dashboard as an
authenticated user via `bun .claude/skills/run-template/driver.ts` (headless
system chromium); drive api/mcp with `curl` plus the seeded `sk-` key.

All paths are relative to the repo root.

## Prerequisites

Nix/direnv environment: `bun`, `docker` (daemon running), and `chromium` must
be on PATH — all come from the flake / system profile, no apt installs. If
`bun` is missing, source the direnv flake profile rc under `.direnv/` first.

## Run (agent path)

The developer's own stack usually occupies the default ports (3000–3002,
5173), and `--strictPort` makes a clash kill the whole run. Always start on
alternate ports:

```bash
PORT=4000 MCP_PORT=4001 AUTH_PORT=4002 WEB_PORT=4174 bun dev
```

Run it in the background; it's ready when `curl -s http://localhost:4174/healthz`
returns `{"status":"ok"}` (~25s: compose wait + `db:push` + seed + vite). The
seed log ends with the dev credentials — capture them:

```
Email: dev@example.com
API key: sk-...
```

api/auth/mcp have no root route — `404` from `/` means the server is up.

### Browser (dashboard)

The driver mints a real session (user row in the dev DB + HMAC-sealed `auth`
cookie, same as `e2e/util/mint.ts`) and drives headless system chromium:

```bash
BASE=http://localhost:4174 bun .claude/skills/run-template/driver.ts shot / home.png
BASE=http://localhost:4174 bun .claude/skills/run-template/driver.ts todo "My title" todo.png
```

| command                  | what it does                                                                |
| ------------------------ | --------------------------------------------------------------------------- |
| `shot <route> [out.png]` | authenticated full-page screenshot of a route                               |
| `todo <title> [out.png]` | creates a todo through the `/todos` form, waits for it to list, screenshots |

It prints page console errors at the end. Env: `BASE`, `DATABASE_URL`, `EMAIL`,
`CHROME_PATH`.

### API / MCP / CLI

```bash
curl -s http://localhost:4000/todo -H "Authorization: Bearer sk-..."   # JSON todo list
```

MCP is bearer-authenticated with the same key (unauthenticated → `{"type":"authentication",...}`):

```bash
curl -s -X POST http://localhost:4001/mcp \
  -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' \
  -H "Authorization: Bearer sk-..." \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"probe","version":"0"}}}'
```

CLI (bare `bun cli api` lists all SDK methods):

```bash
API_URL=http://localhost:4000 TEMPLATE_TOKEN=sk-... bun cli api getMe
```

Stop the stack by killing the `bun dev` process (SIGTERM tears down all four
servers). The postgres container stays up by design — `bun docker:down` stops it.

## Run (human path)

```bash
bun dev   # default ports 3000/3001/3002/5173, Ctrl-C to stop
```

`DB=pglite bun dev` runs in-process postgres instead of docker (in-memory,
single-connection). `RESET=1` wipes the docker pgdata schema first.

## Test

From package dirs, never the repo root (a guard blocks root runs):

```bash
cd packages/core && bun test        # 85 pass, ~5s
cd apps/dashboard && bun run test:e2e   # needs real postgres on :5432 (docker)
```

## Gotchas

- **Default ports are probably taken.** The web server uses `--strictPort`, so
  a clash on 5173 exits vite, and `dev.ts` then SIGTERMs api/mcp/auth too. The
  alternate-port line above avoids the whole class.
- **Playwright's downloaded chromium won't launch on NixOS** (dynamic linking).
  The driver and `e2e/playwright.config.ts` both fall back to `which chromium`;
  override with `CHROME_PATH`.
- **No login UI needed.** Sessions are HMAC cookies (`auth`), signed with a key
  the app mints in the `key` table. The driver creates/finds a user by email
  directly in the DB and seals the cookie itself — the issuer is never involved.
- **The seeded API key is printed only in the seed log.** Each `bun dev` run
  re-seeds and prints `API key: sk-...`; grab it from the dev output, there is
  no other way to read it (keys are stored plaintext but you'd need psql).
- **`bun cli --help` exits 1** after printing usage — cosmetic, not a failure.
- **playwright/@template packages don't resolve from repo root** node_modules;
  the driver imports them by explicit relative path into `apps/dashboard/node_modules`
  and `packages/core/src`. Keep that if you edit it.

## Troubleshooting

- **`Error: Port 5173 is already in use` then every server SIGTERMs**: another
  stack is running. Use the `PORT=4000 ...` line, or reuse the running stack
  (its `/healthz` already answers).
- **`do-not-run-tests-from-root` guard fires**: you ran `bun test` at the repo
  root. `cd` into the package first.
- **Driver hangs on `networkidle`**: first hit after boot compiles the route in
  vite dev — it can take ~10s; that's normal, not a hang.
