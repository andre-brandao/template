import { generateSpecs } from "hono-openapi";
import { memo } from "@template/core/util/memo";
import { routes } from "./routes";
import pkg from "../../package.json";

/**
 * The OpenAPI document for `routes`. `gen:spec` writes it to `packages/sdk/openapi.json`.
 * Generated once: `generateSpecs` drains its component registry as it runs, so a second call
 * comes back without `components.schemas` and every `$ref` in it dangles.
 */
export const spec = memo(() =>
  generateSpecs(routes, {
    documentation: {
      info: {
        title: "Template API",
        description: "Users, organizations, and todos.",
        version: pkg.version ?? "1.0.0",
      },
      components: {
        securitySchemes: {
          Bearer: { type: "http", scheme: "bearer" },
        },
      },
      security: [{ Bearer: [] }],
      servers: [{ description: "Local", url: process.env.API_URL ?? "http://localhost:3000" }],
    },
  }),
);
