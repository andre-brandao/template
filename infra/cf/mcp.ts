import { database, hyperdrive } from "./database";
import { environment } from "./secrets";
import { subdomain } from "./stage";

const mcp = new sst.cloudflare.Worker("Mcp", {
  handler: "./packages/functions/src/mcp/target/worker.ts",
  domain: subdomain("mcp"),
  url: true,
  environment,
  link: [database, hyperdrive],
  // placement: {
  //   region: "aws:sa-east-1"
  // },
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
  mcp: mcp.url,
};
