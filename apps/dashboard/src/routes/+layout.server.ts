import { redirect } from "@sveltejs/kit";
import { Actor } from "@template/core/actor";
import { Feedback } from "$lib/features/feedback/api/feedback";
import { User } from "@template/core/user";
import { DEFAULTS } from "@template/core/user/prefs";
import * as theme from "$lib/server/theme";
import * as zone from "$lib/server/zone";
import type { LayoutServerLoad } from "./$types";

/** Feeds the session context in `+layout.svelte` — read it with `user()`, at any depth. */
export const load: LayoutServerLoad = async (event) => {
  const feedback = Feedback.enabled();
  // Unsigned, client-writable on purpose — worst forgery picks a sidebar width. A cookie
  // (not localStorage) so the first painted HTML is already the right width.
  const rail = event.cookies.get("rail") === "tight";

  // The actor, not the cookie: a stale or revoked token leaves a `public` actor.
  const actor = Actor.use();
  if (actor.type !== "user") return { user: null, prefs: DEFAULTS, feedback, rail };

  const user = await User.fromID(actor.properties.userID);
  if (!user) return { user: null, prefs: DEFAULTS, feedback, rail };

  // `provision` names a fresh account after its address, so a code or OAuth signup arrives
  // with no real name. Everything else waits behind onboarding until there is one.
  if (user.name === user.email && event.url.pathname !== "/welcome") redirect(303, "/welcome");

  // Realign the cookie with the stored preference, so a first visit from a new browser
  // paints in the right theme rather than defaulting to `system` for one navigation.
  theme.write(event, user.prefs.theme);

  // The zone travels the other way, and only once: the browser seeds an empty preference,
  // and from then on it is the user's, so a deliberate choice is never overwritten.
  const seed = await zone.seed(event, user.prefs.zone);

  return { user, prefs: { ...user.prefs, zone: seed }, feedback, rail };
};
