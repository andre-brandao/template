import { database, hyperdrive } from "./database";
import { environment } from "./secrets";

// Fires even after `sst dev` exits — deploy to real stages deliberately.
new sst.cloudflare.Cron("WeeklyInsights", {
  schedules: ["0 8 * * 1"], // Monday 08:00 UTC — covers Mon–Sun of the prior week
  worker: {
    handler: "./packages/functions/src/cron/target/worker.ts",
    environment,
    link: [database, hyperdrive],
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
  },
});
