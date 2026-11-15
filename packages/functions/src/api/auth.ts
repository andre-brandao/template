import { createClient } from "@openauthjs/openauth/client";

export const issuer = process.env.AUTH_URL ?? "http://localhost:3002";

export const client = createClient({ clientID: "api", issuer });
