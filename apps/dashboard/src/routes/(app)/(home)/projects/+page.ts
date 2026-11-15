import { list } from "$lib/features/projects/api/projects.query";
import { warm } from "$lib/query";
import type { PageLoad } from "./$types";

export const load: PageLoad = async (event) => {
  const data = await event.parent();
  const q = event.url.searchParams.get("q") ?? "";
  await warm(data.queryClient, list(q, { fetch: event.fetch }));
};
