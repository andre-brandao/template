import { redirect } from "@sveltejs/kit";
import { client } from "$lib/server/auth";
import type { RequestHandler } from "./$types";

/** Only same-app paths survive as a post-login destination. */
function local(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

export const GET: RequestHandler = async ({ locals, url, cookies }) => {
  const next = local(url.searchParams.get("next"));
  if (locals.session) redirect(303, next ?? "/");

  if (next)
    cookies.set("next", next, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });

  const callback = new URL("/callback", url.origin).toString();
  const { url: authUrl } = await client.authorize(callback, "code");
  redirect(302, authUrl);
};
