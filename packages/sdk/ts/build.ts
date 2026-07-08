import { createClient } from "@hey-api/openapi-ts";

createClient({
  input: {
    path: import.meta.dir + "/../openapi.json",
  },
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
