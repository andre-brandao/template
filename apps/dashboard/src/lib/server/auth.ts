import { createClient } from "@openauthjs/openauth/client";
import { subjects } from "@template/functions/auth/subject";
import { error } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";

export const client = createClient({
  clientID: "dashboard",
  issuer: env.AUTH_URL ?? "http://localhost:3002",
});

/** Exchange an OAuth code for the verified session identity; throws on failure. */
export async function exchange(origin: string, code: string) {
  const tokens = await client.exchange(code, new URL("/callback", origin).toString());
  if (tokens.err) error(400, String(tokens.err));
  const decoded = await client.verify(subjects, tokens.tokens.access);
  if (decoded.err) error(400, String(decoded.err));
  return decoded.subject.properties;
}
