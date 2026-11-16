import { error } from "@sveltejs/kit";
import { Identity } from "@template/core/identity";
import type { LayoutServerLoad } from "./$types";

// Gated once for the back office; core re-checks each read anyway.
export const load: LayoutServerLoad = () => {
  if (!Identity.can({ admin: ["read"] })) error(403, "Admins only");
};
