import { redirect } from "@sveltejs/kit";
import { oauth } from "#lib/server/auth.ts";
import * as next from "#lib/server/next.ts";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = (event) => {
  next.keep(event, event.url.searchParams.get("next"));
  if (event.locals.session) redirect(303, next.take(event));
  return { oauth: oauth() };
};
