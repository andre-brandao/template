import { detectPlatform } from "@tanstack/svelte-hotkeys";
import { Identity } from "@template/core/identity";
import { Feedback } from "@template/core/feedback";
import { User } from "@template/core/user";
import { DEFAULTS } from "@template/core/user/prefs";
import { Agent } from "$lib/features/agent/api/core";
import * as theme from "$lib/server/theme";
import * as zone from "$lib/server/zone";
import type { LayoutServerLoad } from "./$types";

/** Feeds the session context in `+layout.svelte`. Never reads the URL, so navigations skip it. */
export const load: LayoutServerLoad = async (event) => {
  // A preference save invalidates this key rather than every load on the page.
  event.depends("app:prefs");
  const base = {
    user: null,
    prefs: DEFAULTS,
    feedback: Feedback.enabled(),
    // A cookie, not localStorage, so the first painted HTML is already the right width.
    rail: event.cookies.get("rail") === "tight",
    // Hotkey labels render on the server too, so they need the reader's OS up front.
    platform: detectPlatform(event.request.headers.get("user-agent")),
  };

  // The actor, not the cookie: a stale or revoked token leaves a `public` actor.
  const actor = Identity.use();
  if (actor.type !== "user") return base;
  const user = await User.fromID(actor.properties.userID);
  if (!user) return base;

  // Realign the cookie, so a new browser paints the stored theme on its first visit.
  theme.write(event, user.prefs.theme);
  // The browser seeds an empty zone once; after that it is the user's choice.
  const seed = await zone.seed(event, user.prefs.zone);

  return {
    ...base,
    user,
    prefs: { ...user.prefs, zone: seed },
    agent: Agent.ready(),
  };
};
