import { database, hyperdrive } from "./database";
import { environment } from "./secrets";
import { subdomain } from "./stage";

const api = new sst.cloudflare.Worker("Api", {
  handler: "./packages/functions/src/api/target/worker.ts",
  domain: subdomain("api"),
  url: true,
  environment,
  link: [database, hyperdrive],
  transform: {
    worker: (args) => {
      args.compatibilityDate = "2026-03-19";
      args.compatibilityFlags = ["nodejs_compat"];
      args.observability = {
        enabled: true,
        headSamplingRate: 1,
        logs: { enabled: true, invocationLogs: false, headSamplingRate: 1 },
      };
    },
  },
});

export const outputs = {
  api: api.url,
};
