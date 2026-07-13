import { plugin } from "bun";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { compile, compileModule } from "svelte/compiler";
import { mock } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

// Register happy-dom at load so testing-library can bind to document.body on import.
GlobalRegistrator.register();

// Redirect svelte to its client entries so `mount`/`render` work without --conditions browser.
const root = dirname(dirname(fileURLToPath(import.meta.resolve("svelte"))));
const browser: Record<string, string> = {
  svelte: "src/index-client.js",
  "svelte/legacy": "src/legacy/legacy-client.js",
  "svelte/reactivity": "src/reactivity/index-client.js",
  "svelte/store": "src/store/index-client.js",
};
for (const [spec, client] of Object.entries(browser)) {
  mock.module(spec, () => import(join(root, client)));
}

plugin({
  name: "test-svelte-loader",
  setup(builder) {
    builder.onLoad({ filter: /\.svelte(?:\.[cm]?[jt]s)?(?:\?.*)?$/ }, ({ path }) => {
      const file = path.includes("?") ? path.slice(0, path.indexOf("?")) : path;
      const source = readFileSync(file, "utf8");
      const mod = /\.svelte\.[cm]?[jt]s$/.test(file);
      const local = !file.includes("/node_modules/");
      const out = mod
        ? compileModule(source, { filename: file, dev: false, generate: "client" })
        : compile(source, {
            filename: file,
            generate: "client",
            css: "injected",
            dev: false,
            runes: local ? true : undefined,
          });
      return { contents: out.js.code, loader: "js" };
    });
  },
});
