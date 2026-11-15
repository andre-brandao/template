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
        await $`bun sst deploy`;
        // if (event.type === "branch" && event.branch === "dev")
        //   await $`bun run test`.cwd("./packages/functions");
      },
    },
  },
  async run() {
    // postgres.js 4's workerd entry imports cloudflare:sockets, which only the runtime provides.
    $transform(sst.cloudflare.Worker, (args) => {
      args.build = { ...(args.build as object), esbuild: { external: ["cloudflare:*"] } };
    });
    const infra = await import("./infra/sst/cf");
    const outputs = {};
    for (const mod of Object.values(infra))
      if ("outputs" in mod) Object.assign(outputs, mod.outputs);
    return outputs;
  },
});
