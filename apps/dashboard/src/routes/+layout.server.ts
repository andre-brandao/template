import { Actor } from "@template/core/actor";
import { Feedback } from "$lib/features/feedback/api/feedback";
import { User } from "@template/core/user";
import { DEFAULTS } from "@template/core/user/prefs";
import * as theme from "$lib/server/theme";
import type { LayoutServerLoad } from "./$types";

/** Feeds the session context in `+layout.svelte` — read it with `user()`, at any depth. */
export const load: LayoutServerLoad = async (event) => {
  const feedback = Feedback.enabled();

  // The actor, not the cookie: a stale or revoked token leaves a `public` actor.
  const actor = Actor.use();
  if (actor.type !== "user") return { user: null, prefs: DEFAULTS, feedback };

  const user = await User.fromID(actor.properties.userID);
  if (!user) return { user: null, prefs: DEFAULTS, feedback };

  // Realign the cookie with the stored preference, so a first visit from a new browser
  // paints in the right theme rather than defaulting to `system` for one navigation.
  theme.write(event, user.prefs.theme);

  // Parsing rather than spreading: the row carries columns (prefs, timestamps) the
  // client has no business with, and `Info` strips everything it doesn't declare.
  return { user: User.Info.parse(user), prefs: user.prefs, feedback };
};
