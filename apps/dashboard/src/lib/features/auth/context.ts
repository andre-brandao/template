import { createContext } from "svelte";

type User = { name: string; email: string; image: string | null };

/**
 * The signed-in user, or null. Set once in the root layout, readable at any
 * depth. Context is per-request, so unlike a module-level `$state` this can't
 * leak one user's data into the next user's SSR render.
 */
export const [user, provide] = createContext<{ readonly current: User | null }>();
