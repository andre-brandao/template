import type { RequestEvent } from "@sveltejs/kit";
import { Prefs } from "@template/core/user/prefs";

// Only the browser knows where the reader is, so it writes this one itself (see
// `routes/+layout.ts`) — unsigned and not httpOnly, unlike `theme`. The root layout seeds
// an empty preference from it once; after that the stored value is the user's to change.
const COOKIE = "zone";

const schema = Prefs.shape.zone.catch(null);

/** A zone `Intl` accepts, or null — an absent or tampered cookie is nothing to seed from. */
export const read = (event: RequestEvent) => schema.parse(event.cookies.get(COOKIE));
