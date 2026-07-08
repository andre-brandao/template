import { generateSpecs } from "hono-openapi";
import { routes } from "../src/api/routes";
import packageJson from "../package.json";

const spec = await generateSpecs(routes, {
  documentation: {
    info: {
      title: "Template API",
      description: "Users, organizations, and todos.",
      version: packageJson.version ?? "1.0.0",
    },
    components: {
      securitySchemes: {
        Bearer: { type: "http", scheme: "bearer" },
      },
    },
    security: [{ Bearer: [] }],
    servers: [{ description: "Local", url: process.env.API_URL ?? "http://localhost:3000" }],
  },
});

await Bun.write(import.meta.dir + "/../../sdk/openapi.json", JSON.stringify(spec, null, 2));
console.log("Wrote openapi.json");
