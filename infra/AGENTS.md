# infra

Four deployment paths, all optional to local development.

| Path             | What                                                                        |
| ---------------- | --------------------------------------------------------------------------- |
| `sst/cf/`        | **Live.** SST 4: Cloudflare Workers + Hyperdrive. `sst.config.ts` imports this. |
| `sst/aws/`       | Alternate SST wiring: Lambda + VPC + RDS.                                   |
| `terraform/`     | OpenTofu. Same Cloudflare stack as `sst/cf`, independently. See its `README.md`. |
| `docker/`        | Self-contained Compose stack, no SST. See its `README.md`.                  |

Each SST module exports its resources plus an `outputs` object, which `sst.config.ts`
collects by iterating the barrel. A new module is picked up by exporting it from
`index.ts` — there is no registration list.

`terraform/` mirrors `sst/cf/` file-for-file (`api.tf` ↔ `api.ts`, and so on) so the two
stay legible side by side. It reaches parity without any application change, because the
workers read their bindings by name — `Hyperdrive`, `Files`, `Jobs`, `AuthKv`,
`SEND_EMAIL`, declared in `packages/functions/src/cf.ts` — and never import SST's
`Resource`.

Services map to `packages/functions/src/*/target/` — `sst/cf/` and `terraform/` deploy the
`worker` targets, `sst/aws/` the `lambda` ones, `docker/` the `bun` ones. See
[`docs/runtime.md`](../docs/runtime.md).

## Rules

- **Never deploy.** No `sst deploy`, `sst remove`, `tofu apply`, `tofu destroy`, or any
  other infra-mutating command. Prepare the change, then hand the command to the user.
  `tofu fmt`, `tofu validate` and `tofu init -backend=false` are fine — they touch nothing.
- **Never edit `.env`, `.env.example`, `.envrc`, or SST secrets.** Name the variables a
  change needs at handoff; the user sets them.
- Adding a secret means adding it to `secrets.ts` (SST) or `secrets.tf` (Terraform) in the
  relevant path *and* telling the user to run `sst secret set` or export the `TF_VAR_`.
- The two Cloudflare paths must not contend for account-scoped names. `terraform/` keeps
  `var.project = "template-tf"` and a `tf.` domain for exactly that reason — don't align
  them "for consistency".
