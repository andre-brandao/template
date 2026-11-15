import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig, type PluginOption } from "vite";
import * as child_process from "node:child_process";

function cloudflaredPg(): PluginOption {
  return {
    // Bundle postgres's `workerd` entry (src/cf.js) instead of the Node one; the SSR
    // resolve doesn't apply that export condition, so swap the file by hand.
    name: "postgres-cloudflare",
    enforce: "pre",
    // fallow-ignore-next-line complexity
    async resolveId(id, importer, options) {
      if (id === "postgres" && options?.ssr) {
        const resolved = await this.resolve(id, importer, {
          ...options,
          skipSelf: true,
        });
        if (resolved && !resolved.external) {
          const cfPath = resolved.id.replace(/\/src\/index\.js$/, "/src/cf.js");
          if (cfPath !== resolved.id) return cfPath;
        }
      }
      // Leave cloudflare:* imports as external — resolved at CF Workers runtime. The adapter
      // owns `cloudflare:workers`, which it emulates in dev and the analyse step.
      if (id.startsWith("cloudflare:") && id !== "cloudflare:workers") {
        return { id, external: true };
      }
    },
    // cf.js imports cloudflare:sockets statically, which kit's Node analyse step can't load.
    // Defer it into the async `socket()`, so it only runs inside workerd.
    transform(code, id) {
      if (!/\/postgres\/src\/cf\.js$/.test(id)) return;
      return code
        .replace("import { connect } from 'cloudflare:sockets'\n", "")
        .replace("let raw = connect(", "let raw = (await import('cloudflare:sockets')).connect(");
    },
  };
}

// Off Cloudflare nothing provides `cloudflare:workers`; the worker handle reading it never runs there.
function workers(): PluginOption {
  return {
    name: "cloudflare-workers-stub",
    resolveId: (id) => (id === "cloudflare:workers" ? "\0cloudflare:workers" : undefined),
    load: (id) => (id === "\0cloudflare:workers" ? "export const env = {};" : undefined),
  };
}

const sha = child_process.spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" });

const adapter = await (async () => {
  const map = {
    cloudflare: async () => {
      const { default: adapter } = await import("@sveltejs/adapter-cloudflare");
      return adapter();
    },
    bun: async () => {
      const { default: adapter } = await import("@sveltejs/adapter-bun");
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
    sveltekit({
      version: {
        // No git in the image build (`.git` is dockerignored), so fall back to
        // kit's own default rather than failing the build.
        name: sha.status === 0 ? sha.stdout.trim() : Date.now().toString(),
      },
      compilerOptions: {
        // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
        runes: ({ filename }) =>
          filename.split(/[/\\]/).includes("node_modules") ? undefined : true,
      },
      // Remote functions (`$app/server`'s query/form/command) are still experimental in kit 3.
      experimental: { remoteFunctions: true },
      adapter,
      inspector: {
        toggleKeyCombo: "control-shift",
        holdMode: true,
        showToggleButton: "always",
        toggleButtonPos: "bottom-right",
      },
    }),
    process.env.SVELTE_ADAPTER === "cloudflare" ? cloudflaredPg() : workers(),
  ],
  build: {
    rolldownOptions: {
      output: {
        // elkjs's browserify prelude reads a free `require`, so rolldown emits a
        // module-scope `createRequire(import.meta.url)`. workerd has no import.meta.url,
        // so that throws at startup. Unpolyfilled, `typeof require` is just undefined.
        ...(process.env.SVELTE_ADAPTER === "cloudflare" && { polyfillRequire: false }),
      },
    },
  },
});
