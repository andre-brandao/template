import * as next from "#lib/server/next.ts";
import type { LayoutServerLoad } from "./$types";

// Reads the URL only on the way out, so it never reruns on a navigation.
export const load: LayoutServerLoad = async (event) => {
  next.gate(event, (await event.parent()).user);
};
