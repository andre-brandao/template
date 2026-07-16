import tailwindcss from "@tailwindcss/vite";
// import adapter from "@sveltejs/adapter-node";
// import adapter from "@sveltejs/adapter-cloudflare";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

const selectedAdapter = process.env.SVELTE_ADAPTER;

const adapter = await (async () => {
  switch (selectedAdapter) {
    case "cloudflare":
      const { default: adapterCloudflare } = await import("@sveltejs/adapter-cloudflare");
      return adapterCloudflare();
    case "bun":
      const { default: adapterBun } = await import("svelte-adapter-bun");
      return adapterBun();
    case "sst-aws":
      const { default: adapterAws } = await import("svelte-kit-sst");
      return adapterAws();
    case "node":
    default:
      const { default: adapterNode } = await import("@sveltejs/adapter-node");
      return adapterNode();
  }
})();

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      compilerOptions: {
        // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
        runes: ({ filename }) =>
          filename.split(/[/\\]/).includes("node_modules") ? undefined : true,
        // Required for remote functions (`$app/server`'s query/form/command) to use top-level await.
        experimental: { async: true },
      },
      // Required for remote functions (`$app/server`'s query/form/command). This is a `kit`-level
      // option, but since config is passed inline here (no svelte.config.js in this app), SvelteKit
      // flattens `KitConfig` fields like `adapter` and `experimental` directly onto this object.
      experimental: { remoteFunctions: true },
      adapter,
    }),
  ],
});
