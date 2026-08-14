import { generateSpecs } from "hono-openapi";
import { routes } from "./routes";
import pkg from "../../package.json";

/** The OpenAPI document for `routes`. `gen:spec` writes it to `packages/sdk/openapi.json`. */
export const spec = () =>
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
  });
