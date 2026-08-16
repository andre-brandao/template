# infra

Three deployment paths, all optional to local development.

| Path            | What                                                                   |
| --------------- | ------------------------------------------------------------------------ |
| `cf/`           | **Live.** Cloudflare Workers + Hyperdrive. `sst.config.ts` imports this. |
| `aws/`          | Alternate SST wiring: Lambda + VPC + RDS.                               |
| `docker/`       | Self-contained Compose stack, no SST. See its `README.md`.              |

Each SST module exports its resources plus an `outputs` object, which `sst.config.ts`
collects by iterating the barrel. A new module is picked up by exporting it from
`index.ts` — there is no registration list.

Services map to `packages/functions/src/*/target/` — `cf/` deploys the `worker` targets,
`aws/` the `lambda` ones, `docker/` the `bun` ones. See
[`docs/runtime.md`](../docs/runtime.md).

## Rules

- **Never deploy.** No `sst deploy`, `sst remove`, or any infra-mutating command. Prepare
  the change, then hand the command to the user.
- **Never edit `.env`, `.env.example`, or SST secrets.** Name the variables a change needs
  at handoff; the user sets them.
- Adding a secret means adding it to `secrets.ts` in the relevant path *and* telling the
  user to run `sst secret set`.
