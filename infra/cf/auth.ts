import { database, hyperdrive } from "./database";
import { environment } from "./secrets";
import { subdomain } from "./stage";

const authKv = new sst.cloudflare.Kv("AuthKv");

const auth = new sst.cloudflare.Worker("Auth", {
  handler: "./packages/functions/src/auth/worker.ts",
  domain: subdomain("auth"),
  url: true,
  environment,
  link: [database, hyperdrive, authKv],
  build: {
    loader: { ".css": "text" },
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

export const outputs = {
  auth: auth.url,
};
