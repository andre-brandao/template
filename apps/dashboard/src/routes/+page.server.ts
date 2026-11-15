import * as next from "$lib/server/next";
import type { PageServerLoad } from "./$types";

// Signed out sees the pitch; signed in still has to be named first.
export const load: PageServerLoad = async (event) => {
  const data = await event.parent();
  if (data.user) next.gate(event, data.user);
};
