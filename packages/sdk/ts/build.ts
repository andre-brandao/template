import { createClient } from "@hey-api/openapi-ts";

const input = { path: import.meta.dir + "/../openapi.json" };

// Sequential on purpose: this job cleans `src/`, which would wipe `src/query/` mid-write.
await createClient({
  input,
  output: import.meta.dir + "/src",
  plugins: [
    {
      name: "@hey-api/sdk",
      paramsStructure: "flat",
      exportFromIndex: true,
      operations: {
        containerName: "TemplateSdk",
        strategy: "single",
      },
    },
  ],
});

// TanStack's queryFn only speaks grouped params, so it gets its own SDK and `client`.
await createClient({
  input,
  output: import.meta.dir + "/src/query",
  plugins: [
    { name: "@hey-api/sdk", exportFromIndex: true },
    {
      name: "@tanstack/svelte-query",
      exportFromIndex: true,
      queryKeys: { tags: true },
    },
  ],
});
