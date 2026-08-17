import type { RequestEvent } from "@sveltejs/kit";
import { User } from "@template/core/user";
import { Prefs } from "@template/core/user/prefs";

// Only the browser knows where the reader is, so it writes this one itself (see
// `routes/+layout.ts`) — unsigned and not httpOnly, unlike `theme`. The root layout seeds
// an empty preference from it once; after that the stored value is the user's to change.
const COOKIE = "zone";

const schema = Prefs.shape.zone.catch(null);

/** A zone `Intl` accepts, or null — an absent or tampered cookie is nothing to seed from. */
const read = (event: RequestEvent) => schema.parse(event.cookies.get(COOKIE));

/**
 * The zone the page should use, seeding an empty preference from the cookie on the way. Only
 * ever writes over an unset zone, so a deliberate choice is never overwritten by a browser.
 */
export async function seed(event: RequestEvent, zone: Prefs["zone"]) {
  if (zone) return zone;
  const cookie = read(event);
  if (cookie) await User.prefs({ zone: cookie });
  return cookie;
}
