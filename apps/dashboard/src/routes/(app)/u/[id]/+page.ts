import { history } from "#lib/features/people/api/people.query.ts";
import { warm } from "#lib/query.ts";
import type { PageLoad } from "./$types";

// The layout already holds the profile; this adds its activity.
export const load: PageLoad = async (event) => {
  const data = await event.parent();
  await warm(data.queryClient, history(event.params.id, { fetch: event.fetch }));
};
