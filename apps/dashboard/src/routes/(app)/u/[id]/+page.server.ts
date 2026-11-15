import { Identity } from "@template/core/identity";
import * as next from "$lib/server/next";
import type { PageServerLoad } from "./$types";

// Profiles are for signed-in users only; a visitor is sent to log in, not shown a 401.
export const load: PageServerLoad = (event) => {
  if (Identity.use().type !== "user") next.login(event);
};
