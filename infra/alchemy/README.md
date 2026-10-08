# infra/alchemy

The same app as `infra/sst/cf`, deployed by [Alchemy v2](https://alchemy.run) instead of
SST. `alchemy.run.ts` plays the role of `sst.config.ts`. Unlike `terraform/`, it does not
mirror `sst/cf/` file-for-file: all five workers live in `workers.ts`, so their shared env and
settings are written once and their differences read side by side.

Alchemy v2 is **beta** (`2.0.0-beta.81`, pinned exactly in this folder's `package.json`, a workspace package
so `alchemy` and `effect` stay out of the root).
Expect breaking changes between betas — bump deliberately.

```
alchemy.run.ts   the Stack: providers, state, prod retention, outputs
workers.ts       api, auth, mcp, queue consumer, dashboard (+ its build)
database.ts      PlanetScale role -> Hyperdrive, plus migrator role + migration run
resources.ts     R2 `Files`, KV `AuthKv`, `Jobs` + DLQ, `send_email`
secrets.ts       app env, read from the deployer's environment
stage.ts         stage -> hostname, permanent stages
```

## Coexisting with SST and terraform

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

## Configuration

| What               | Where                                                                    |
| ------------------ | ------------------------------------------------------------------------ |
| Cloudflare auth    | `alchemy profile edit --add Cloudflare`, or `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` with `CI=true` |
| PlanetScale auth   | `alchemy profile edit --add Planetscale`, or `PLANETSCALE_API_TOKEN_ID`, `PLANETSCALE_API_TOKEN`, `PLANETSCALE_ORGANIZATION=andrebrandao` with `CI=true` |
| App secrets        | Plain env vars / `.env` at deploy time: `SESSION_SECRET` (required), `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_PROVIDERS`, `EXAMPLE_SECRET` |

There is no `sst secret set` equivalent: values come from whoever runs the deploy, so keep
per-stage values in the shell or CI secrets. They bind as `secret_text`.

State lives in Cloudflare (`Cloudflare.state()`): the first deploy offers to create an
`alchemy-state-store` worker in the account.

## Deploy

Paths in the stack resolve from the repo root, so run it from there or from `infra/alchemy`
(where the config argument can be dropped). `.env` and `.alchemy/` are read from the cwd.

```bash
bun alchemy plan   infra/alchemy/alchemy.run.ts --stage dev
bun alchemy deploy infra/alchemy/alchemy.run.ts --stage dev
bun alchemy destroy infra/alchemy/alchemy.run.ts --stage pr-123
```

Always pass `--stage`: without it Alchemy deploys to `live_$USER`.

## Known gaps against infra/sst/cf

| Gap | Why |
| --- | --- |
| Hyperdrive points at PgBouncer (6432) | Kept to match `sst/cf`. Alchemy's docs recommend the direct `role.origin` (5432) since Hyperdrive pools itself — worth testing. |
| Bundling is rolldown, not esbuild | Uses `workerd` export conditions by default, so `postgres` resolves its CF build. Smoke each worker after the first deploy. |
| `new_module_registry` compat flag | Alchemy adds it by default for these compatibility dates; SST doesn't. |
| Dashboard is a `Command.Build` + plain Worker | `Website.SvelteKit` needs `@sveltejs/kit` >= 3.0.0-next.27 (the dashboard is on 2.x), and its own build would skip `vite.config.ts`'s `SVELTE_ADAPTER`-gated `polyfillRequire: false`. The build re-runs when non-gitignored files in `apps/dashboard` change — not on `packages/*` changes, same as SST. |
| MCP binds `Jobs` | `mcp/target/worker.ts` reads it; `sst/cf/mcp.ts` doesn't link it. |
| No CI workflow | `.github/workflows/deploy.yml` still deploys SST only. |
