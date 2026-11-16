import { defineEnvVars } from "@sveltejs/kit/env";
import { z } from "zod";

const optional = { schema: z.string().optional() };

export const variables = defineEnvVars({
  API_URL: optional,
  AUTH_URL: optional,
  AUTH_PROVIDERS: optional,
  GITHUB_CLIENT_ID: optional,
  GOOGLE_CLIENT_ID: optional,
  DATABASE_URL: optional,
  // Read by core off process.env: `single` (default) or `multi`, and the single-mode schema.
  WORKSPACES: optional,
  WORKSPACE_SCHEMA: optional,
  // Inlined at build: it picks the providers at module load, before any request.
  SVELTE_ADAPTER: { ...optional, static: true },
  // The TanStack devtools block the main thread for ~400ms on every page load in dev.
  DEVTOOLS: { schema: (value) => value === "1", public: true, static: true },
});
