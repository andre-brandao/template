# infra

Deploy paths for the app. None of them is needed for local development (`bun dev`).
[`AGENTS.md`](AGENTS.md) has the layout and the rules for editing them.

## Supported vs experimental paths

| Path             | Status           | What                                                         |
| ---------------- | ---------------- | ------------------------------------------------------------ |
| `sst/cf/`        | **Supported**    | Live. SST 4 on Cloudflare Workers + Hyperdrive.              |
| `docker/`        | **Supported**    | Self-hosting. Compose stack, no SST. See its `README.md`.    |
| `sst/aws/`       | Experimental     | Lambda + VPC + RDS. Not deployed; no queue consumer.         |
| `terraform/`     | Experimental     | OpenTofu mirror of `sst/cf`. Its CI and deploy jobs are off. |
| `alchemy/cf/`    | Experimental     | Alchemy v2 (beta) mirror of `sst/cf`.                        |
| `alchemy/docker/`| Experimental     | Alchemy v2 (beta) mirror of `docker/`.                       |

Runtime changes are checked against the supported paths only. Experimental paths
may drift (for example `alchemy/docker/` still runs `QUEUE_DRIVER=sync`), so verify
one before deploying it.
