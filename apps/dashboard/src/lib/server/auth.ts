import { createClient } from "@openauthjs/openauth/client";
import { subjects } from "@template/functions/auth/subject";
import { error } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import { OauthIds } from "@template/core/user/provider.sql";

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

/**
 * The OAuth providers the issuer can actually serve. `AUTH_PROVIDERS` is the issuer's own
 * switch; without it, a client id in the environment is the tell — which is what a local
 * stack sharing one `.env` has. Password and code logins never appear here: they are the
 * dashboard's own, and need no issuer.
 */
export function oauth() {
  const want = env.AUTH_PROVIDERS?.trim();
  const ids = want
    ? want.split(",").map((s) => s.trim())
    : OauthIds.filter((id) => env[`${id.toUpperCase()}_CLIENT_ID`]);
  return OauthIds.filter((id) => ids.includes(id));
}
