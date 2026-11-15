import { browser } from "$app/environment";
import { local } from "$lib/utils/fmt";
import { queryClient } from "$lib/query";
import type { LayoutLoad } from "./$types";

// Only the browser knows where the reader is: it writes the cookie the server seeds the zone
// from. Runs again during hydration, so a first visit reports without waiting for a navigation.
export const load: LayoutLoad = (event) => {
  const client = queryClient(event.url.origin);
  if (!browser) return { ...event.data, queryClient: client };
  document.cookie = `zone=${local()};path=/;max-age=31536000;samesite=lax`;
  // Only fills the gap before the seed lands; a stored choice is never overridden.
  return {
    ...event.data,
    prefs: { ...event.data.prefs, zone: event.data.prefs.zone ?? local() },
    queryClient: client,
  };
};
