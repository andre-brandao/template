import { list, stages } from "#lib/features/todos/api/todos.query.ts";
import { warm } from "#lib/query.ts";
import type { PageLoad } from "./$types";

// The facts and stage list sit above the fold; warmed here, SSR paints them instead of skeletons.
export const load: PageLoad = async (event) => {
  const data = await event.parent();
  const ctx = { fetch: event.fetch };
  const scope = { source: "project", sourceID: event.params.id };
  await warm(data.queryClient, list(scope, ctx), stages(scope, ctx));
};
