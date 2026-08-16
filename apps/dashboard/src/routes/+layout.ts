import { browser } from "$app/environment";
import { local } from "$lib/utils/fmt";
import type { LayoutLoad } from "./$types";

/**
 * Only the browser knows where the reader is, so it answers for itself here — the cookie
 * is how the server finds out, and `+layout.server.ts` seeds the preference from it once.
 * Runs again during hydration, so a first visit reports without waiting for a navigation.
 */
export const load: LayoutLoad = ({ data }) => {
  if (!browser) return data;
  document.cookie = `zone=${local()};path=/;max-age=31536000;samesite=lax`;
  // Only fills the gap before the seed lands — a stored choice is never overridden.
  return { ...data, prefs: { ...data.prefs, zone: data.prefs.zone ?? local() } };
};
