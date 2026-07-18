import { createClient } from "@openauthjs/openauth/client";

export const client = createClient({
  clientID: "api",
  issuer: process.env.AUTH_URL ?? "http://localhost:3002",
});
