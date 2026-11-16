# scripts

Bun scripts for running and populating the stack locally. Run from the repo root.

| Script               | What                                                                   |
| -------------------- | ---------------------------------------------------------------------- |
| `dev.ts`             | The whole stack. Spawns every service, owns their lifetimes and output |
| `seed.ts`            | Demo data through core's own operations — no raw inserts               |
| `pglite.ts`          | In-process Postgres for `DB=pglite`, and the test preload              |
| `feature.ts`         | Scaffolds a full vertical slice                                        |
| `reset.ts`           | Drops every table and type, so the next `db:push` rebuilds             |
| `prototype.ts`       | Serves `docs/prototype/<feature>/PROTOTYPE.md` with its mockups        |
| `coverage.ts`        | Aggregates per-package lcov into one table for CI                      |
| `testing/webhook.ts` | Webhook receiver for manual testing; the user's to run                 |

## bun dev

`bun dev web` (or `api`, `mcp`, several at once) starts the database, the essentials
(`auth`, `queue`) and only the named apps. No names starts everything. Before the apps it
pushes the schema (`db:push`) and runs the seed.

| Env                                                   | Effect                                                     |
| ----------------------------------------------------- | ---------------------------------------------------------- |
| `DB`                                                  | `docker` (default, `infra/docker/compose.yml`) or `pglite` |
| `RESET=1`                                             | Wipes first; only matters for docker, pglite starts empty  |
| `PGPORT` `API_PORT` `MCP_PORT` `AUTH_PORT` `WEB_PORT` | Moves a service off its default port                       |
| `DEVTOOLS=1`                                          | TanStack devtools in the dashboard                         |

## pglite

`pglite.ts` serves PGlite over `@electric-sql/pglite-socket`: up to 100 connections, every
query through one queue, so an open transaction stalls the rest until it commits — keep
transactions short. It wraps the socket's private `queryQueue` so an extended-protocol
exchange sticks to one client, which is why `pglite-socket` is pinned exactly in
`package.json`. Bump it only after checking the wrapper still fits.

## Rules

- **Never kill the user's servers.** No `pkill` sweeps — the dev stack runs continuously.
  Need a port, use a different one.
- `feature.ts` refuses to overwrite. It writes the core module and test, API handler, MCP
  tool, dashboard query/components/page and route, then wires `identifier.ts`,
  `permission.ts`, `examples.ts`, the API routes and the MCP index in place. Prefer it over
  hand-wiring a slice.
- Seeds go through `Identity.provide` + core functions, so permissions and events fire the
  same way they would in the app. Keep it that way — a raw insert seeds invalid states.
- A script that `Database.connect()`s releases the pool when done (`Database.release`):
  `bun dev` waits on the seed's exit, and an idle pool holds it open.
- `scripts/testing/webhook.ts` is the user's to run, not an agent's.
