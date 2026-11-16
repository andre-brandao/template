import { error } from "@sveltejs/kit";
import { Identity } from "@template/core/identity";
import type { LayoutServerLoad } from "./$types";

// Apps and webhooks both see the whole workspace; core re-checks every read and write anyway.
export const load: LayoutServerLoad = () => {
  if (!Identity.can({ app: ["read"] })) error(403, "Admins only");
};
