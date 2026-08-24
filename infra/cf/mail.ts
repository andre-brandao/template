/// <reference path="../../.sst/platform/config.d.ts" />
import { database, hyperdrive } from "./database";
import { environment } from "./secrets";
import { files } from "./storage";

/**
 * The inbound receiver. It has no URL — Cloudflare invokes it through Email Routing, so
 * the last step is a dashboard one: route the address to this worker.
 */
const mail = new sst.cloudflare.Worker("Mail", {
  handler: "./packages/functions/src/mail/target/worker.ts",
  environment,
  link: [database, hyperdrive, files],
  placement: {
    region: "aws:sa-east-1",
  },
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
  mail: mail.nodes.worker.scriptName,
};
