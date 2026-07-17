// fallow-ignore-file unused-file
import { createClient } from "@template/sdk/client";
import { TemplateSdk } from "@template/sdk";
import { app } from "@template/functions/api";

/**
 * Not used directly by the dashboard anymore — it calls `@template/core` modules
 * directly instead of going through the HTTP API. Kept as an example of calling the
 * Hono app in-process (like `app.request()` in the functions test suite), for
 * templates that do want an API layer between the dashboard and core. Pass an `sk-`
 * API key to authenticate the call.
 */
export function api(token?: string) {
  const client = createClient({
    baseUrl: "http://api.internal",
    // @ts-ignore it is valid
    fetch: (request: Request) => app.fetch(request),
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
  return new TemplateSdk({ client });
}
