# infra/terraform

The same app as `infra/sst/cf`, deployed by OpenTofu instead of SST. Both paths
are live-capable and both can run at once, which is the reason for the first
section below.

```
build.ts           the worker bundler — see "Why not the bun build CLI" below
modules/
  environment/     environment name -> domain. Nothing else.
  bun-build/       runs build.ts at apply time, exposes the artifact path
  local-command/   generic apply-time command (SvelteKit build, db migrations)
  worker/          bundle -> cloudflare_workers_script (+ subdomain, routes, custom domain)
  database/        PlanetScale role -> Hyperdrive, plus the migration run
  queue/           cloudflare_queue + its dead letter queue
envs/
  cloudflare/      root module: the whole stack. Mirrors infra/sst/cf/*.ts file-for-file.
  aws/             stub. See its README.
```

## Read this before your first apply

Both stacks deploy the same app to the same Cloudflare account, so they can
collide in two different ways.

**Hostnames** are handled for you: `base_domain` defaults to
`tf.template.developing.company`, one label below the SST stack's
`template.developing.company`. Nothing Terraform creates can contend for a
hostname SST owns.

**Account-scoped names are not namespaced by DNS.** Queue names, R2 buckets, KV
namespaces and Hyperdrive configs live in a flat per-account namespace. SST
appends a random suffix to each; Terraform is deterministic, so `var.project`
does that job instead and defaults to `template-tf`. Setting it to `template`
will fight the SST stack for those names. Don't.

The PlanetScale cluster is the one thing both paths genuinely share — it is
looked up, never created, by either. They take separate roles on it.

## The problem this solves

Terraform wants to read files during **plan**. A bundle produced by `bun build`
doesn't exist yet at plan time, so the usual `data "archive_file"` /
`filebase64` approach fails on a clean checkout — or, worse, silently ships a
stale artifact from the last run.

The fix is to keep the build in a *resource* and make every consumer depend on
it, which pushes the read to apply time:

```hcl
module "build_api" { source = "../../modules/bun-build" ... }   # terraform_data + local-exec

# inside modules/worker
resource "terraform_data" "gate" { input = var.build_id }
data "local_file" "entry" {
  filename   = var.artifact_path
  depends_on = [terraform_data.gate]        # <- defers the read to apply
}
```

Rebuilds are driven by `bun-build`'s `source_hash` — a SHA-256 over every file
matching the watched globs. Same sources, same flags: no rebuild and no diff.

Unlike upstream, the hash spans **more than one package**: every worker bundles
`packages/core`, and the dashboard also pulls `packages/ui` and `packages/sdk/ts`,
so those are passed as `watch_dirs` and hashed too. A change in core rebuilds all
five workers, which is correct — they all embed it.

### The same problem, once more, for static assets

`assets.directory` is a plain string, so the provider stats that directory during
plan — but SvelteKit only writes `.svelte-kit/cloudflare` during apply. Routing
the directory through the build gate's output makes the whole expression unknown
at plan whenever a rebuild is pending, which is the HCL equivalent of what
`infra/sst/cf/dashboard.ts` does with `build.stdout.apply(() => path)`.

If that ever misbehaves, build first and apply with `-var build=false`. That is
the recommended CI path regardless.

## Why not the `bun build` CLI

`bun-build` shells out to `build.ts`, which calls `Bun.build()`. That indirection
is load-bearing: the CLI's `--conditions` flag does **not** override a package's
exports map, while the programmatic `conditions` option does.

It matters for exactly one package, and badly. `postgres` ships a Cloudflare
build behind a `workerd` export condition:

```json
"exports": {
  "bun":     "./src/index.js",
  "workerd": "./cf/src/index.js",
  "import":  "./src/index.js",
  "default": "./cjs/src/index.js"
}
```

Miss that condition and you resolve the Node build, which reaches for `net` and
`tls` — neither of which a Worker has. The bundle still *builds*; it fails at
runtime, on the first query. This is the same problem the `cloudflaredPg` plugin
in `apps/dashboard/vite.config.ts` solves for the dashboard.

Note the condition is `workerd`, not `worker`. `worker` alone matches nothing in
that map.

To check a bundle by hand, list what it left external — everything should be a
prefixed `node:*` builtin:

```bash
grep -o 'from"[^"]*"' packages/functions/dist/api/worker.js | sort -u
```

## Why the worker uses content_file, not content

`cloudflare_workers_script` accepts either. With `content`, the provider's Read
overwrites state from the remote body, so every plan re-diffs the bundle and
prints all of it. With `content_file` the Read skips `content` entirely and
reconciles on `content_sha256` alone:

```hcl
content_file   = var.artifact_path
content_sha256 = data.local_file.entry.content_sha256
```

When a rebuild is pending the data read is deferred, so the hash is unknown at
plan and the script updates. When nothing changed the read happens at plan, the
hash matches state, and there is no diff at all.

## Configuration comes from the environment

Nothing here needs `-var` on the command line.

| What | Where it comes from |
|---|---|
| Cloudflare auth | `CLOUDFLARE_API_TOKEN` — read by the provider directly |
| Cloudflare account | `CLOUDFLARE_DEFAULT_ACCOUNT_ID` — bridge it to `TF_VAR_account_id` |
| PlanetScale auth | `PLANETSCALE_SERVICE_TOKEN_ID`, `PLANETSCALE_SERVICE_TOKEN` |
| App secrets | `TF_VAR_session_secret` and friends — see `envs/cloudflare/secrets.tf` |

OpenTofu only auto-loads env vars prefixed `TF_VAR_`, and it has no `getenv()`.
The Cloudflare v5 provider also dropped provider-level `account_id` — it is a
per-resource argument now — so `CLOUDFLARE_DEFAULT_ACCOUNT_ID` is not read by
anything on its own. Bridge it in `.envrc`:

```sh
if [[ -n "${CLOUDFLARE_DEFAULT_ACCOUNT_ID:-}" ]]; then
  export TF_VAR_account_id="$CLOUDFLARE_DEFAULT_ACCOUNT_ID"
fi
```

Forgetting it fails validation with a message telling you exactly that, rather
than dropping into an interactive prompt.

`SESSION_SECRET` is the only required app secret; everything else defaults to
empty, and the auth issuer enables an OAuth provider only when its credentials
are present. Secrets become `secret_text` bindings, so they render as
`(sensitive value)` in plan output rather than leaking into CI logs.

**Cloudflare Secrets Store is deliberately not used.** Its bindings are async
accessors (`await env.X.get()`), and this app reads secrets as plain strings so
that one codebase serves Workers, Lambda and the Docker stack alike.

## Deploy

```bash
cd infra/terraform/envs/cloudflare
tofu init
tofu apply

curl "$(tofu output -raw api)/readyz"
```

Bindings are created under the exact names `packages/functions/src/cf.ts`
declares — `Hyperdrive`, `Files`, `Jobs`, `AuthKv`, `SEND_EMAIL` — which is the
whole reason no application code changes between this path and SST.

## Environments

The environment is the OpenTofu workspace, so one root module serves all of
them — there is no per-environment directory to copy.

```bash
tofu workspace select default        # environment "dev"
tofu workspace new prod              # environment "prod"
tofu workspace new pr-123            # ephemeral
```

`modules/environment` turns the name into a domain and nothing else:

| Environment | Domain | API hostname |
|---|---|---|
| `prod` | `tf.template.developing.company` | `api.tf.template.developing.company` |
| `dev` | `dev.tf.template.developing.company` | `api.dev.tf.template.developing.company` |
| `pr-123` | `pr-123.dev.tf.template.developing.company` | `api.pr-123.dev.tf.template.developing.company` |

Hostnames are composed by the consuming module, not by `modules/environment` —
`modules/worker` joins `var.subdomain` to `var.domain` with a dot. A second
service is another module call with its own `subdomain`, and the environment
module never changes.

Note this differs from `infra/sst/cf/stage.ts`, which joins with a hyphen on
ephemeral stages to stay one label under a wildcard certificate.
`cloudflare_workers_custom_domain` provisions a certificate per hostname, so
that constraint does not apply here.

`prod` and `dev` are permanent (`permanent_environments`); everything else is
ephemeral. Ephemeral environments log at full sampling, and — like the
`isPermanentStage` gate on the SST side — get neither a migrator role nor a
migration run. They share the permanent branch's schema.

## Migrations

`modules/database` runs `bun run db:migrate` in `packages/core` on permanent
environments, triggered by a content hash over `packages/core/migrations/**/*.sql`.

It needs a real **`node`** on `PATH`: `drizzle-kit` reaches for `node:sqlite`,
which Bun does not provide. This is the same reason `infra/docker` copies a Node
binary into its migrate image and the SST deploy workflow installs Node 24. Set
`-var run_migrations=false` to skip it.

## CI

Build in the pipeline, then hand Terraform the finished artifacts:

```bash
bun install --frozen-lockfile
bun run --filter dashboard build          # SVELTE_ADAPTER=cloudflare
tofu -chdir=infra/terraform/envs/cloudflare apply -auto-approve -var build=false
```

With `build = false` no `local-exec` runs, so every artifact must already exist —
nothing else will create them.

## Known gaps against infra/sst/cf

| Gap | Why |
|---|---|
| No regional placement | Every SST worker pins `placement.region = "aws:sa-east-1"`. The provider exposes `placement.mode` only; `region` is read-only. Expect higher latency to a São Paulo Hyperdrive origin. |
| Bundling is `Bun.build`, not SST's esbuild + unenv pipeline | Every bundle was checked to import only prefixed `node:*` builtins, which `nodejs_compat` provides — but different polyfill behaviour is still possible at runtime. Smoke each worker after a deploy. |
| State holds a live Postgres password | Hyperdrive needs the plaintext, so `planetscale_postgres_redacted_branch_role` is unusable. Use the R2 backend or OpenTofu state encryption rather than leaving `terraform.tfstate` on disk. |
| MCP gets a `Jobs` binding here, but not on SST | `mcp/target/worker.ts` reads `env.Jobs` and `infra/sst/cf/mcp.ts` never links the queue — a bug on that side. `var.mcp_bind_queue` controls it. |

## Provider versions

Root modules pin to the current latest with `~>`; the shared modules under
`modules/` only set floors, so they stay reusable from a root on a newer minor.

| Provider | Pinned in envs | Floor in modules |
|---|---|---|
| `cloudflare/cloudflare` | `~> 5.24` | `>= 5.11` (`assets.directory` on `workers_script`) |
| `planetscale/planetscale` | `~> 1.3` | `>= 1.3` |
| `hashicorp/local` | `~> 2.9` | `>= 2.9` |
| `hashicorp/aws` | `~> 6.61` | — |
| `hashicorp/archive` | `~> 2.8` | — |

To move to a newer release:

```bash
cd infra/terraform/envs/cloudflare
tofu init -upgrade
tofu providers lock \
  -platform=linux_amd64 -platform=linux_arm64 \
  -platform=darwin_amd64 -platform=darwin_arm64
```

then bump the `~>` constraint in `versions.tf` to match.
