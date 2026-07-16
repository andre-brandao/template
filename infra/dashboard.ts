import { createHash } from "crypto"
import { readdirSync, statSync } from "fs"
import { database, hyperdrive } from "./database.ts";
import { environment } from "./secrets";
import { domain } from './stage.ts'

// export const r2 = new sst.cloudflare.Bucket("Artifacts");

const dir = `${process.cwd()}/apps/dashboard`

const hash = readdirSync(`${dir}/src`, { recursive: true, withFileTypes: true })
  .filter((e) => e.isFile())
  .reduce((h, e) => {
    const p = `${e.parentPath}/${e.name}`
    const s = statSync(p)
    return h.update(`${p}:${s.size}:${s.mtimeMs}`)
  }, createHash("sha1"))
  .digest("hex")

const build = new command.local.Command("DashboardBuild", {
  dir,
  create: "bun run build",
  update: "bun run build",
  environment: {
    SVELTE_ADAPTER: "cloudflare",
  },
  triggers: [hash],
})

// Gate the worker's esbuild bundling on the DashboardBuild command. `dependsOn` only
// orders the Cloudflare Script resource; the local esbuild step (Runtime.Build) fires as
// soon as `handler` resolves. Threading `build.stdout` makes the handler an Output that is
// only known after the build ran, so `_worker.js` exists on disk before esbuild reads it.
const dashboard = new sst.cloudflare.Worker("Dashboard", {
  handler: build.stdout.apply(() => "./apps/dashboard/.svelte-kit/cloudflare/_worker.js"),
  url: true,
  domain,
  assets: {
    directory: "./apps/dashboard/.svelte-kit/cloudflare",
  },
  build: {

  },
  environment,
  link: [
    database,
    hyperdrive
  ],
  placement: {
    region: "aws:sa-east-1"
  },
  transform: {
    worker: (args) => {
      args.compatibilityDate = "2026-03-19";
      args.compatibilityFlags = ["nodejs_compat"];
      // args.bindings = $resolve(args.bindings ?? []).apply((bindings) => [
      //   ...bindings,
      //   {
      //     type: "send_email",
      //     name: "SEND_EMAIL",
      //   }
      // ]);
      args.observability = {
        enabled: true,
        headSamplingRate: 1,
        logs: {
          enabled: true,
          invocationLogs: false,
          headSamplingRate: 1,
        },
      };
    },
  },
}, {
  dependsOn: [build],
});


export const outputs = {
  dashboard: dashboard.url,
};
