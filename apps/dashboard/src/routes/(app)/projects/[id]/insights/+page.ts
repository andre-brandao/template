import { insights } from "#lib/features/todos/api/todos.query.ts";
import { warm } from "#lib/query.ts";
import type { PageLoad } from "./$types";

export const load: PageLoad = async (event) => {
  const data = await event.parent();
  const scope = { source: "project", sourceID: event.params.id };
  await warm(data.queryClient, ...insights(event.url, data.prefs, scope, { fetch: event.fetch }));
};
