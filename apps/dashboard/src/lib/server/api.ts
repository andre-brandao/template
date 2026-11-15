// fallow-ignore-file unused-file
import { createClient } from "@template/sdk/client";
import { app } from "@template/functions/api";

/**
 * Unused by the dashboard (it calls core directly); kept as an example of calling the
 * Hono app in-process: `getMe({ client: api(key) })`. Pass an `sk-` API key to authenticate.
 */
export function api(token?: string) {
  return createClient({
    baseUrl: "http://api.internal",
    // @ts-ignore it is valid
    fetch: (request: Request) => app.fetch(request),
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}
