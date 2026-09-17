/// <reference path="../../../.sst/platform/config.d.ts" />
import { createHash } from "crypto"
import { readdirSync, statSync } from "fs"
import { database, hyperdrive } from "./database";
import { files } from "./storage";
import { jobs } from "./queue";
import { environment } from "./secrets";
import { subdomain } from './stage'


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

// Threading `build.stdout` makes `handler` an Output resolved only after DashboardBuild,
// so `_worker.js` exists on disk before esbuild reads it (`dependsOn` can't order that).
const dashboard = new sst.cloudflare.Worker("Dashboard", {
  handler: build.stdout.apply(() => "./apps/dashboard/.svelte-kit/cloudflare/_worker.js"),
  url: true,
  domain: subdomain("dashboard"),
  assets: {
    directory: "./apps/dashboard/.svelte-kit/cloudflare",
  },
  build: {

  },
  // Also a runtime var, not just a build one: `hooks/server/providers.ts` picks its provider set
  // from it, since the Hyperdrive/R2 bindings are per-request on this target alone.
  environment: { ...environment, SVELTE_ADAPTER: "cloudflare" },
  link: [
    database,
    hyperdrive,
    files,
    jobs
  ],
  placement: {
    region: "aws:sa-east-1",
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
