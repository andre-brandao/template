import { Actor } from "@template/core/actor";
import * as next from "$lib/server/next";
import type { LayoutServerLoad } from "./$types";

// Settings pages read the signed-in user straight from layout context, so unlike the
// remote-function pages they need the redirect up front rather than on first fetch.
export const load: LayoutServerLoad = (event) => {
  if (Actor.use().type !== "user") next.login(event);
};
