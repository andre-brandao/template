import { board } from "$lib/features/todos/api/todos.query";
import { warm } from "$lib/query";
import type { PageLoad } from "./$types";

export const load: PageLoad = async (event) => {
  const data = await event.parent();
  const scope = { source: "project", sourceID: event.params.id };
  await warm(data.queryClient, ...board(event.url, scope, { fetch: event.fetch }));
};
