import { createClient } from "@openauthjs/openauth/client";
import { env } from "$env/dynamic/private";

export const client = createClient({
  clientID: "dashboard",
  issuer: env.AUTH_URL ?? "http://localhost:3002",
});
