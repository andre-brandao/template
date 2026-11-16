import { Identity } from "@template/core/identity";
import type { LayoutServerLoad } from "./$types";

// Which groups the rail lists; the `(workspace)` and `(admin)` layouts are what refuse.
export const load: LayoutServerLoad = () => ({
  apps: Identity.can({ app: ["read"] }),
  admin: Identity.can({ admin: ["read"] }),
});
