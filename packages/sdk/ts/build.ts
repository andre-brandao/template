import { createClient } from "@hey-api/openapi-ts";

// One grouped-params tree: TanStack's queryFn only speaks `{ path, query, body }`.
// Plain functions, not a class: TanStack would resolve a class through a global registry.
await createClient({
  input: { path: import.meta.dir + "/../openapi.json" },
  output: import.meta.dir + "/src",
  plugins: [
    { name: "@hey-api/sdk", exportFromIndex: true },
    {
      name: "@tanstack/svelte-query",
      exportFromIndex: true,
      queryKeys: { tags: true },
      // Nothing pages by cursor; the plugin mistakes insights' `start` for one.
      infiniteQueryKeys: false,
      infiniteQueryOptions: false,
    },
  ],
});
