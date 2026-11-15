import { createClient } from "@openauthjs/openauth/client";
import { subjects } from "@template/functions/auth/subject";
import { error } from "@sveltejs/kit";
import { AUTH_PROVIDERS, AUTH_URL, GITHUB_CLIENT_ID, GOOGLE_CLIENT_ID } from "$app/env/private";
import { OauthIds } from "@template/core/auth/provider.sql";
import { Auth } from "@template/core/auth";

export const client = createClient({
  clientID: "dashboard",
  issuer: AUTH_URL ?? "http://localhost:3002",
});

/**
 * Exchange an OAuth code for a local `userID`; throws on failure. The issuer only vouches for
 * who they are — linking that to a row here is this app's call, so one issuer serves many apps.
 */
export async function exchange(origin: string, code: string) {
  const tokens = await client.exchange(code, new URL("/callback", origin).toString());
  if (tokens.err) error(400, String(tokens.err));
  const decoded = await client.verify(subjects, tokens.tokens.access);
  if (decoded.err) error(400, String(decoded.err));
  const subject = decoded.subject.properties;
  return Auth.link({
    provider: subject.provider,
    accountId: subject.id,
    email: subject.email,
    name: subject.name,
  });
}

/**
 * The OAuth providers the issuer can actually serve. `AUTH_PROVIDERS` is the issuer's own
 * switch; without it, a client id in the environment is the tell — which is what a local
 * stack sharing one `.env` has. Password and code logins never appear here: they are the
 * dashboard's own, and need no issuer.
 */
export function oauth() {
  const want = AUTH_PROVIDERS?.trim();
  // Client ids are declared one by one in src/env.ts, so the name can't be built from the id.
  const configured = {
    github: GITHUB_CLIENT_ID,
    google: GOOGLE_CLIENT_ID,
  } satisfies Record<(typeof OauthIds)[number], string | undefined>;
  const ids = want ? want.split(",").map((s) => s.trim()) : OauthIds.filter((id) => configured[id]);
  return OauthIds.filter((id) => ids.includes(id));
}
