import { error, redirect } from "@sveltejs/kit";
import { Actor } from "@template/core/actor";
import type { LayoutServerLoad } from "./$types";

// The back office gates once, here, rather than per page: every screen under it is
// admin-only, and core re-checks each individual read anyway.
export const load: LayoutServerLoad = () => {
  if (Actor.use().type !== "user") redirect(303, "/login");
  if (!Actor.can({ admin: ["read"] })) error(403, "Admins only");
};
