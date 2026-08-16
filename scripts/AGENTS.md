# scripts

Bun scripts for running and populating the stack locally. Run from the repo root.

| Script         | What                                                                   |
| -------------- | ---------------------------------------------------------------------- |
| `dev.ts`       | The whole stack. Spawns every service, owns their lifetimes and output |
| `seed.ts`      | Demo data through core's own operations — no raw inserts               |
| `pglite.ts`    | In-process Postgres for `DB=pglite`                                    |
| `feature.ts`   | Scaffolds a full vertical slice                                        |

## bun dev

`DB=docker` (default) runs Postgres from `infra/docker/compose.yml`; `DB=pglite` runs it
in-process. `RESET=1` wipes first — which only matters for docker, since pglite starts
empty anyway.

pglite allows exactly **one live connection**, which is why the services cycle their pool
(`PG_RELEASE=true`) instead of holding one. If you add a service to `dev.ts`, it inherits
that env or it will fight the dashboard for the socket.

## Rules

- **Never kill the user's servers.** No `pkill` sweeps — the dev stack runs continuously.
  Need a port, use a different one.
- `feature.ts` refuses to overwrite, and edits `identifier.ts` + `examples.ts` in place.
  Prefer it over hand-wiring a new slice.
- Seeds go through `Actor.provide` + core functions, so permissions and events fire the
  same way they would in the app. Keep it that way — a raw insert seeds invalid states.
- `scripts/testing/webhook.ts` is the user's to run, not an agent's.
