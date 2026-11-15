import { error } from "@sveltejs/kit";
import { Identity } from "@template/core/identity";
import type { LayoutServerLoad } from "./$types";

// Gated once for the admin half; core re-checks every read and write anyway.
export const load: LayoutServerLoad = () => {
  if (!Identity.can({ app: ["read"] })) error(403, "Admins only");
};
