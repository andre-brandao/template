import { redirect } from "@sveltejs/kit";
import * as next from "#lib/server/next.ts";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const data = await event.parent();
  if (!data.user) redirect(303, "/login");
  // Held for `onboard`, so it lands where the gate stopped the user.
  next.keep(event, event.url.searchParams.get("next"));
  if (data.user.name !== data.user.email) redirect(303, next.take(event));
  return { email: data.user.email };
};
