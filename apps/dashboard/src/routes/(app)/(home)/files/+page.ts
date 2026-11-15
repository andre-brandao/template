import { list } from "$lib/features/files/api/files.query";
import { warm } from "$lib/query";
import type { PageLoad } from "./$types";

export const load: PageLoad = async (event) => {
  const data = await event.parent();
  await warm(data.queryClient, list({ fetch: event.fetch }));
};
