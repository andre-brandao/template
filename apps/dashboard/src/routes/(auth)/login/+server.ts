import { redirect } from "@sveltejs/kit";
import { client } from "$lib/server/auth";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals, url }) => {
  if (locals.session) redirect(303, "/");

  const callback = new URL("/callback", url.origin).toString();
  const { url: authUrl } = await client.authorize(callback, "code");
  redirect(302, authUrl);
};
