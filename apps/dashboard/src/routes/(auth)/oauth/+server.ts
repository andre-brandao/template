import { error, redirect } from "@sveltejs/kit";
import { client, oauth } from "$lib/server/auth";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals, url }) => {
  if (locals.session) redirect(303, "/");

  // Named rather than implicit: the issuer serves only OAuth now, so there is no default
  // provider for it to fall back to.
  const provider = url.searchParams.get("provider");
  if (!oauth().some((id) => id === provider)) error(400, "Unknown provider");

  const callback = new URL("/callback", url.origin).toString();
  const { url: authUrl } = await client.authorize(callback, "code", { provider: provider! });
  redirect(302, authUrl);
};
