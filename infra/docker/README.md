# Docker Compose deployment

A self-contained stack that runs the whole app with no SST, Cloudflare, or
PlanetScale — just containers. It's an alternative to the SST/Cloudflare path
(`sst.config.ts`, `infra/cf/*`); the two coexist.

## Services

| Service     | Host port | What it is                                            |
| ----------- | --------- | ----------------------------------------------------- |
| `postgres`  | 5432      | Postgres 17, persisted to the `pgdata` volume         |
| `migrate`   | —         | One-shot `drizzle-kit migrate`, then exits            |
| `api`       | 8080      | Hono API (`serve api`), `/healthz` healthcheck        |
| `mcp`       | 3001      | MCP server (`serve mcp`), path `/mcp`                 |
| `dashboard` | 3000      | SvelteKit dashboard (adapter-node, `serve dashboard`) |

The three app services share one image (`template-app`) built from the repo
root. The image's entrypoint is the `template-cli`; each service just passes a
`serve <target>` verb. `api`/`mcp`/`dashboard` wait for `migrate` to finish.

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
- API: <http://localhost:8080/healthz>
- MCP: <http://localhost:3001/mcp>

Tear down (add `-v` to also drop the database volume):

```sh
docker compose -f infra/docker/compose.yml down
```

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
