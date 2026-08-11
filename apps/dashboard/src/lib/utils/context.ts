import { createContext } from "svelte";
import type { User } from "@template/core/user";
import type { Permission } from "@template/core/permission";
import type { Prefs } from "@template/core/user/prefs";

/**
 * The signed-in user (or null) and their preferences. Set once in the root layout,
 * readable at any depth. Context is per-request, so unlike a module-level `$state` this
 * can't leak one user's data into the next user's SSR render.
 *
 * `prefs` sits alongside `current` rather than inside it, and is never null: logged-out
 * pages still render dates, and the server falls back to core's defaults.
 *
 * `can` is bound in the root layout, which may import core at runtime — this module may
 * not, so it only names the type. Use it to hide controls, never to secure anything: core
 * runs the same check again on every mutation.
 */
export const [user, provide] = createContext<{
  readonly current: User.Info | null;
  readonly prefs: Prefs;
  can(grants: Permission.Grants, owned?: boolean): boolean;
}>();
