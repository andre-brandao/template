/// <reference path="../../.sst/platform/config.d.ts" />
import { database, hyperdrive } from "./database";
import { files } from "./storage";
import { environment } from "./secrets";

/**
 * Retries and burial live here, not in the driver — the adapter only pushes, so
 * `QUEUE_RETRIES`/`QUEUE_BACKOFF` don't apply on Cloudflare. Cloudflare creates the
 * dead letter queue on first use; the name is stage-scoped so stages don't share one.
 */
export const jobs = new sst.cloudflare.Queue("Jobs", {
  dlq: { queue: `${$app.name}-${$app.stage}-jobs-dlq`, retry: 3 },
});

// The consumer needs the queue itself so handlers can enqueue follow-up jobs.
jobs.subscribe({
  handler: "./packages/functions/src/queue/target/worker.ts",
  environment,
  link: [database, hyperdrive, files, jobs],
  placement: {
    region: "aws:sa-east-1",
  },
  transform: {
    worker: (args) => {
      args.compatibilityDate = "2026-03-19";
      args.compatibilityFlags = ["nodejs_compat"];
      args.bindings = $resolve(args.bindings ?? []).apply((bindings) => [
        ...bindings,
        { type: "send_email", name: "SEND_EMAIL" },
      ]);
      args.observability = {
        enabled: true,
        headSamplingRate: 1,
        logs: { enabled: true, invocationLogs: false, headSamplingRate: 1 },
      };
    },
  },
});
