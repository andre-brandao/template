import { error } from "@sveltejs/kit";
import { Identity } from "@template/core/identity";
import * as next from "$lib/server/next";
import type { LayoutServerLoad } from "./$types";

// The back office gates once, here, rather than per page: every screen under it is
// admin-only, and core re-checks each individual read anyway.
export const load: LayoutServerLoad = (event) => {
  if (Identity.use().type !== "user") next.login(event);
  if (!Identity.can({ admin: ["read"] })) error(403, "Admins only");
};
