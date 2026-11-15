import { insights } from "$lib/features/todos/api/todos.query";
import { warm } from "$lib/query";
import type { PageLoad } from "./$types";

export const load: PageLoad = async (event) => {
  const data = await event.parent();
  await warm(data.queryClient, ...insights(event.url, data.prefs, {}, { fetch: event.fetch }));
};
