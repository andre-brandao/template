import { Actor } from "@template/core/actor";
import { User } from "@template/core/user";
import { Organization } from "@template/core/organization";
import type { LayoutServerLoad } from "./$types";

/** Feeds the session context in `+layout.svelte` — read it with `session()`, at any depth. */
export const load: LayoutServerLoad = async () => {
  // The actor, not the cookie: a stale or revoked token leaves a `public` actor.
  const actor = Actor.use();
  if (actor.type !== "user") return { user: null, org: null, orgs: [], permissions: [] };

  const user = await User.fromID(actor.properties.userID);
  if (!user) return { user: null, org: null, orgs: [], permissions: [] };

  const orgs = await Organization.list();
  return {
    user: { name: user.name, email: user.email, image: user.image },
    org: orgs.find((o) => o.id === actor.properties.orgID) ?? null,
    orgs,
    permissions: actor.properties.permissions ?? [],
  };
};
