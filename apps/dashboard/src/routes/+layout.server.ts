import { Actor } from "@template/core/actor";
import { User } from "@template/core/user";
import type { LayoutServerLoad } from "./$types";

/** Feeds the session context in `+layout.svelte` — read it with `session()`, at any depth. */
export const load: LayoutServerLoad = async () => {
  // The actor, not the cookie: a stale or revoked token leaves a `public` actor.
  const actor = Actor.use();
  if (actor.type !== "user") return { user: null };

  const user = await User.fromID(actor.properties.userID);
  if (!user) return { user: null };

  return { user: { name: user.name, email: user.email, image: user.image } };
};
