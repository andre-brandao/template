/// <reference path="./.sst/platform/config.d.ts" />
export default $config({
  app(input) {
    return {
      name: "template",
      removal: input?.stage === "prod" ? "retain" : "remove",
      protect: ["prod"].includes(input?.stage),
      home: "cloudflare",
      providers: {
        command: { package: "@pulumi/command", version: "1.2.1" },
        planetscale: { package: "@sst-provider/planetscale", version: "1.0.0" },
      },
    };
  },
  console: {
    autodeploy: {
      async workflow({ $, event }) {
        await $`bun install`;
        if (event.action === "removed") {
          await $`bun sst remove`;
          return;
        }
        await $`bun run build`.cwd("./apps/dashboard");
        await $`bun sst deploy`;
        // if (event.type === "branch" && event.branch === "dev")
        //   await $`bun run test`.cwd("./packages/functions");
      },
    },
  },
  async run() {
    const outputs = {};
    const { readdirSync } = await import("fs");
    for (const value of readdirSync("./infra/")) {
      const result = await import("./infra/" + value);
      if (result.outputs) Object.assign(outputs, result.outputs);
    }
    return outputs;
  },
});
