import { createContext } from "svelte";

type Info = { id: string; name: string };

/**
 * The active organization, the user's orgs, and the actor's permissions. Set
 * once in the root layout, readable at any depth. `can` drives cosmetic gating
 * only — core enforces for real. `path` prefixes an app path with the active
 * org, e.g. `path('/todos')` → `/org_123/todos`.
 */
export const [org, provide] = createContext<{
  readonly current: Info | null;
  readonly orgs: Info[];
  readonly permissions: string[];
  can(perm: string): boolean;
  path(to: string): string;
}>();
