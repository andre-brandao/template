import { error } from "@sveltejs/kit";
import { Identity } from "@template/core/identity";
import * as next from "#lib/server/next.ts";
import type { LayoutServerLoad } from "./$types";

// Gated once for the back office; core re-checks each read anyway.
export const load: LayoutServerLoad = async (event) => {
  next.gate(event, (await event.parent()).user);
  if (!Identity.can({ admin: ["read"] })) error(403, "Admins only");
};
