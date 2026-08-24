# Docker Compose deployment

A self-contained stack that runs the whole app with no SST, Cloudflare, or
PlanetScale — just containers. It's an alternative to the SST/Cloudflare path
(`sst.config.ts`, `infra/cf/*`); the two coexist.

## Services

| Service     | Host port | What it is                                            |
| ----------- | --------- | ----------------------------------------------------- |
| `postgres`  | 5432      | Postgres 17, persisted to the `pgdata` volume         |
| `migrate`   | —         | One-shot `drizzle-kit migrate`, then exits            |
| `api`       | 8080      | Hono API (`serve api`)                                |
| `mcp`       | 3001      | MCP server (`serve mcp`), path `/mcp`                 |
| `auth`      | 3002      | OpenAuth issuer (`serve auth`)                        |
| `dashboard` | 3000      | SvelteKit dashboard (adapter-node, `serve dashboard`) |

The four app services share one image (`template-app`) built from the repo
root. The image's entrypoint is the `template-cli`; each service just passes a
`serve <target>` verb. Each waits for `migrate` to finish.

`migrate` uses a separate image (`template-migrate`) that adds a Node binary
solely to run `drizzle-kit migrate` — drizzle-kit needs `node:sqlite`, which
Bun doesn't provide. Node stays out of the app runtime images.

## Run

From the repo root:

```sh
bun docker:up      # copies .env from .env.example if missing, builds, starts detached
bun docker:logs    # follow logs
bun docker:down    # stop and remove
```

`bun docker` proxies straight to `docker compose -f infra/docker/compose.yml`
(e.g. `bun docker ps`, `bun docker run --rm migrate`). Edit `infra/docker/.env`
to change ports, secrets, or point at an external database.

Equivalent raw commands:

```sh
cp infra/docker/.env.example infra/docker/.env   # then edit as needed
docker compose -f infra/docker/compose.yml up --build
```

- Dashboard: <http://localhost:3000>
- API: <http://localhost:8080/readyz>
- MCP: <http://localhost:3001/mcp>

Tear down (add `-v` to also drop the database volume):

```sh
docker compose -f infra/docker/compose.yml down
```

## Probes

Every app service answers the same three, unauthenticated and out of the request log:

| Path        | Probe     | Answers                                                          |
| ----------- | --------- | ---------------------------------------------------------------- |
| `/healthz`  | liveness  | the process is up — nothing else is touched, so a database outage never reads as a dead process |
| `/readyz`   | readiness | the database answers too; 503 when it doesn't                    |
| `/startupz` | startup   | boot finished — latches on the first good readiness check, so an outage after that fails readiness alone |

Docker allows one probe per container, so `healthcheck` runs `template-cli health
<target>`, which defaults to `/readyz`: it is the question `depends_on: condition:
service_healthy` asks. The CLI resolves the port from the same env var the server binds,
and prints the response body into `docker inspect` → `State.Health.Log`. The shared `x-probe` anchor in
`compose.yml` sets `start_period`, which is Docker's startup probe — a failure inside it
costs no retry, and the first success ends it. Liveness has nothing to hang off here:
Docker never restarts a container for going unhealthy, so the probe would be inert.

On Kubernetes the three map straight onto `livenessProbe: /healthz`, `readinessProbe:
/readyz` and `startupProbe: /startupz`. On Lambda and Cloudflare (`infra/aws`,
`infra/cf`) nothing calls them — neither platform probes.

## Notes

- **Adapter:** the dashboard is built with `SVELTE_ADAPTER=node` (set in the
  Dockerfile). Switch to `bun`/`cloudflare` there if you ever want a different
  target — it's already wired in `apps/dashboard/vite.config.ts`.
- **External database:** point `DATABASE_URL` at a managed Postgres and remove
  the `postgres` service (and the `migrate` dependency on it) to run without the
  bundled db.
- **Migrations:** re-run on demand with
  `docker compose -f infra/docker/compose.yml run --rm migrate`.
- **Env:** `.env` is git-ignored and never baked into the image (it's read by
  Compose at runtime). Auth needs no JWT secret — tokens are DB-backed keys.
