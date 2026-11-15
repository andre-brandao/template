import { Identity } from "@template/core/identity";
import type { LayoutServerLoad } from "./$types";

// Everyone gets their own keys here; Apps and Webhooks are the admin half, gated below.
export const load: LayoutServerLoad = () => ({ admin: Identity.can({ app: ["read"] }) });
