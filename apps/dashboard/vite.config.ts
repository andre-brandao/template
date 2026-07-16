import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

const adapter = await (async () => {
  const map = {
    cloudflare: async () => {
      const { default: adapter } = await import("@sveltejs/adapter-cloudflare");
      return adapter();
    },
    bun: async () => {
      const { default: adapter } = await import("svelte-adapter-bun");
      return adapter();
    },
    "sst-aws": async () => {
      const { default: adapter } = await import("svelte-kit-sst");
      return adapter();
    },
    node: async () => {
      const { default: adapter } = await import("@sveltejs/adapter-node");
      return adapter();
    },
  } as const;
  const selected = process.env.SVELTE_ADAPTER;

  if (!selected || !Object.keys(map).includes(selected)) {
    return map["node"]();
  }
  return map[selected as keyof typeof map]();
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
