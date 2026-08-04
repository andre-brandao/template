import { redirect } from "@sveltejs/kit";
import { Actor } from "@template/core/actor";
import type { LayoutServerLoad } from "./$types";

// Settings pages read the signed-in user straight from layout context, so unlike the
// remote-function pages they need the redirect up front rather than on first fetch.
export const load: LayoutServerLoad = () => {
  if (Actor.use().type !== "user") redirect(303, "/login");
};
