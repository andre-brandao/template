import { createContext } from "svelte";
import type { User } from "@template/core/user";
import type { Permission } from "@template/core/permission";
import type { Prefs } from "@template/core/user/prefs";

/**
 * The signed-in user (or null) and their prefs, set once in the root layout. Context is
 * per-request, so it can't leak across SSR renders. `can` is bound in the layout (this
 * module can't import core at runtime) — use it to hide controls, never to secure.
 */
export const [user, createUser] = createContext<{
  readonly current: User.Info | null;
  readonly prefs: Prefs;
  can(grants: Permission.Grants, owned?: boolean): boolean;
}>();
