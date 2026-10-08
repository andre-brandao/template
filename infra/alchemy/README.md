# infra/alchemy

The app deployed by [Alchemy v2](https://alchemy.run), one stack per target. Each
`alchemy.run.ts` plays the role of `sst.config.ts`.

| Stack               | Target                                          | Mirrors          | State      |
| ------------------- | ----------------------------------------------- | ---------------- | ---------- |
| `cf/`               | Cloudflare Workers + Hyperdrive on PlanetScale  | `infra/sst/cf`   | Cloudflare |
| `docker/`           | Containers on the local Docker daemon           | `infra/docker`   | `.alchemy` |

`shared.ts` holds the repo root and the app secrets every stack reads. There is no AWS
stack yet: `infra/sst/aws` is the reference when one is needed.

Alchemy v2 is **beta** (`2.0.0-beta.81`, pinned exactly in this folder's `package.json`, a workspace package
so `alchemy` and `effect` stay out of the root).
Expect breaking changes between betas — bump deliberately.

## cf

Unlike `terraform/`, it does not mirror `sst/cf/` file-for-file: all five workers live in
`workers.ts`, so their shared env and settings are written once and their differences read
side by side.

```
cf/alchemy.run.ts   the Stack: providers, state, prod retention, outputs
cf/workers.ts       api, auth, mcp, queue consumer, dashboard (+ its build)
cf/database.ts      PlanetScale role -> Hyperdrive, plus migrator role + migration run
cf/resources.ts     R2 `Files`, KV `AuthKv`, `Jobs` + DLQ, `send_email`
cf/secrets.ts       shared secrets + the stage's AUTH_URL
cf/stage.ts         stage -> hostname, permanent stages
```

### Coexisting with SST and terraform

All three Cloudflare paths deploy to the same account.

- **Hostnames** live under `alc.template.developing.company`, one label below SST's.
- **Account-scoped names** (queues, buckets, KV, Hyperdrive) are derived from the stack
  name `template-alc` + stage + id, so they never match SST's or terraform's.
- The **PlanetScale cluster** `agents` is shared and only looked up; this stack takes its
  own roles on it.

| Stage    | API hostname                              |
| -------- | ----------------------------------------- |
| `prod`   | `api.alc.template.developing.company`     |
| `dev`    | `api.dev.alc.template.developing.company` |
| `pr-123` | `api.pr-123.dev.alc.template.developing.company` |

`prod` and `dev` are permanent: only they get a migrator role and a migration run
(`bun run db:migrate` in `packages/core`, re-run when `migrations/**/*.sql` changes).
`prod` resources are retained on `alchemy destroy`.

The database (`testing-alc` on branch `main`) is created by hand, once — Alchemy can't
create a database inside a branch. Migrations connect with `options=-c role=postgres`, so
`postgres` owns the schema rather than whichever migrator role ran them.

### Configuration

| What               | Where                                                                    |
| ------------------ | ------------------------------------------------------------------------ |
| Cloudflare auth    | `alchemy profile edit --add Cloudflare`, or `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` with `CI=true` |
| PlanetScale auth   | `alchemy profile edit --add Planetscale`, or `PLANETSCALE_API_TOKEN_ID`, `PLANETSCALE_API_TOKEN`, `PLANETSCALE_ORGANIZATION=andrebrandao` with `CI=true` |
| App secrets        | Plain env vars / `.env` at deploy time: `SESSION_SECRET` (required), `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_PROVIDERS`, `EXAMPLE_SECRET` |

There is no `sst secret set` equivalent: values come from whoever runs the deploy, so keep
per-stage values in the shell or CI secrets. They bind as `secret_text`.

State lives in Cloudflare (`Cloudflare.state()`): the first deploy offers to create an
`alchemy-state-store` worker in the account.


### Known gaps against infra/sst/cf

| Gap | Why |
| --- | --- |
| Hyperdrive points at PgBouncer (6432) | Kept to match `sst/cf`. Alchemy's docs recommend the direct `role.origin` (5432) since Hyperdrive pools itself — worth testing. |
| Bundling is rolldown, not esbuild | Uses `workerd` export conditions by default, so `postgres` resolves its CF build. Smoke each worker after the first deploy. |
| `new_module_registry` compat flag | Alchemy adds it by default for these compatibility dates; SST doesn't. |
| Dashboard is a `Command.Build` + plain Worker | `Website.SvelteKit` needs `@sveltejs/kit` >= 3.0.0-next.27 (the dashboard is on 2.x), and its own build would skip `vite.config.ts`'s `SVELTE_ADAPTER`-gated `polyfillRequire: false`. The build re-runs when non-gitignored files in `apps/dashboard` change — not on `packages/*` changes, same as SST. |
| MCP binds `Jobs` | `mcp/target/worker.ts` reads it; `sst/cf/mcp.ts` doesn't link it. |
| No CI workflow | `.github/workflows/deploy.yml` still deploys SST only. |

## docker

`infra/docker/compose.yml` as a stack, built from the same `infra/docker/Dockerfile`
(`runtime` and `migrate` targets). Host ports are compose's + 10000, so both can run at once:

| Service   | URL                          |
| --------- | ---------------------------- |
| dashboard | <http://localhost:13000>     |
| api       | <http://localhost:18080>     |
| mcp       | <http://localhost:13001/mcp> |
| auth      | <http://localhost:13002>     |
| postgres  | `localhost:15432`            |

Compose's `.env` becomes the deployer's env: the shared secrets (`SESSION_SECRET` required)
plus an optional `POSTGRES_PASSWORD` (default `password`). The rest of compose's `.env` is
fixed in `docker/alchemy.run.ts`.

Containers start without waiting on each other, so the migration (`Command.Exec`) polls
`pg_isready` and then runs the `migrate` image once; it re-runs when `migrations/**/*.sql`
change. A label carrying its hash stands in for `depends_on: migrate`, and a rebuilt
image replaces the containers that run it. Ports are fixed, so one stage at a time.

## Deploy

Paths in the stacks resolve from the repo root, so run them from there or from
`infra/alchemy`. `.env` and `.alchemy/` (the docker stack's state) are read from the cwd.

```bash
bun alchemy plan    infra/alchemy/cf/alchemy.run.ts --stage dev
bun alchemy deploy  infra/alchemy/cf/alchemy.run.ts --stage dev
bun alchemy destroy infra/alchemy/cf/alchemy.run.ts --stage pr-123

bun alchemy deploy  infra/alchemy/docker/alchemy.run.ts --stage dev
bun alchemy destroy infra/alchemy/docker/alchemy.run.ts --stage dev
```

Always pass `--stage`: without it Alchemy deploys to `live_$USER`.
