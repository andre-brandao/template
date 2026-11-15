import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

// Health checks hit `/` without a cookie, so only a signed-in reader is sent on.
export const load: PageServerLoad = async (event) => {
  if ((await event.parent()).user) redirect(303, "/home");
};
