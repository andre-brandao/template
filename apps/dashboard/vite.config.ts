import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig, type PluginOption } from "vite";

function cloudflaredPg(): PluginOption {
  return {
    // Bundle postgres's CF Workers build instead of the Node.js build.
    // The CF build (postgres/cf/src/index.js) uses cloudflare:sockets via a
    // dynamic import inside Socket.connect(), so net/tls are never imported —
    // unenv-sst has nothing to stub.
    name: "postgres-cloudflare",
    enforce: "pre",
    async resolveId(id, importer, options) {
      if (id === "postgres" && options?.ssr) {
        const resolved = await this.resolve(id, importer, {
          ...options,
          skipSelf: true,
        });
        if (resolved && !resolved.external) {
          const cfPath = resolved.id.replace(/\/src\/index\.js$/, "/cf/src/index.js");
          if (cfPath !== resolved.id) return cfPath;
        }
      }
      // Leave cloudflare:* imports as external — resolved at CF Workers runtime.
      // The dynamic import('cloudflare:sockets') in postgres/cf/polyfills.js is
      // only called at runtime inside Socket.connect(), never during the build.
      if (id.startsWith("cloudflare:")) {
        return { id, external: true };
      }
    },
  };
}

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
    ...(process.env.SVELTE_ADAPTER === "cloudflare" ? [cloudflaredPg()] : []),
  ],
});
