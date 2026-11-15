import { Identity } from "@template/core/identity";
import * as next from "$lib/server/next";
import type { LayoutServerLoad } from "./$types";

// Signed-in only: a visitor is sent to log in, not shown a 401. A layout, so `+layout.ts` runs after it.
export const load: LayoutServerLoad = (event) => {
  if (Identity.use().type !== "user") next.login(event);
};
