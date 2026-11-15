import { Identity } from "@template/core/identity";
import * as next from "$lib/server/next";
import type { LayoutServerLoad } from "./$types";

// Everyone gets their own keys here; Apps and Webhooks are the admin half, gated below.
export const load: LayoutServerLoad = (event) => {
  if (Identity.use().type !== "user") next.login(event);
  return { admin: Identity.can({ app: ["read"] }) };
};
