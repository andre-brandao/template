import * as Cloudflare from "alchemy/Cloudflare";
import * as Command from "alchemy/Command";
import * as Output from "alchemy/Output";
import { Stack } from "alchemy/Stack";
import path from "node:path";
import * as Effect from "effect/Effect";
import { root } from "../shared";
import { Hyperdrive } from "./database";
import { AuthKv, Dlq, Email, Files, Jobs } from "./resources";
import { environment } from "./secrets";
import { host } from "./stage";


export const workers = Effect.gen(function* () {
  const stack = yield* Stack;
  const env = { ...environment(stack.stage), Hyperdrive };
  const base = {
    compatibility: { date: "2026-03-19", flags: ["nodejs_compat"] },
    placement: { region: "aws:sa-east-1" },
    observability: {
      enabled: true,
      headSamplingRate: 1,
      logs: { enabled: true, invocationLogs: false, headSamplingRate: 1 },
    },
  };

  const api = yield* Cloudflare.Worker("Api", {
    ...base,
    main: path.join(root, "packages/functions/src/api/target/worker.ts"),
    domain: host("api", stack.stage),
    env: { ...env, Files, Jobs },
  });

  const auth = yield* Cloudflare.Worker("Auth", {
    ...base,
    main: path.join(root, "packages/functions/src/auth/target/worker.ts"),
    domain: host("auth", stack.stage),
    build: { input: { moduleTypes: { ".css": "text" } } },
    env: { ...env, AuthKv, SEND_EMAIL: Email },
  });

  // Binds `Jobs`, which `mcp/target/worker.ts` reads and infra/sst/cf/mcp.ts forgets.
  const mcp = yield* Cloudflare.Worker("Mcp", {
    ...base,
    main: path.join(root, "packages/functions/src/mcp/target/worker.ts"),
    domain: host("mcp", stack.stage),
    env: { ...env, Jobs },
  });

  // The consumer needs the queue itself so handlers can enqueue follow-up jobs.
  const consumer = yield* Cloudflare.Worker("Queue", {
    ...base,
    main: path.join(root, "packages/functions/src/queue/target/worker.ts"),
    workersDev: false,
    env: { ...env, Files, Jobs, SEND_EMAIL: Email },
  });
  yield* Cloudflare.Queues.Consumer("JobsConsumer", {
    queueId: (yield* Jobs).queueId,
    scriptName: consumer.workerName,
    deadLetterQueue: (yield* Dlq).queueName,
    settings: { maxRetries: 3 },
  });

  // Our own adapter-cloudflare build: `Website.SvelteKit` needs kit 3, and its build would
  // skip vite.config.ts's SVELTE_ADAPTER-gated options.
  const build = yield* Command.Build("DashboardBuild", {
    command: "bun run build",
    cwd: path.join(root, "apps/dashboard"),
    outdir: ".svelte-kit/cloudflare",
    env: { SVELTE_ADAPTER: "cloudflare" },
  });
  // `main` and `assets` read the build's Outputs, so bundling waits for it. SVELTE_ADAPTER is
  // also a runtime var: `hooks/server/providers.ts` picks per-request bindings from it.
  const dashboard = yield* Cloudflare.Worker("Dashboard", {
    ...base,
    main: Output.interpolate`${build.outdir}/_worker.js`,
    assets: build.outdir,
    domain: host("dashboard", stack.stage),
    env: { ...env, SVELTE_ADAPTER: "cloudflare", Files, Jobs },
  });

  return { api: api.url, auth: auth.url, mcp: mcp.url, dashboard: dashboard.url };
});
