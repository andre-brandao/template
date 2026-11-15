import { list } from "#lib/features/files/api/files.query.ts";
import { warm } from "#lib/query.ts";
import type { PageLoad } from "./$types";

export const load: PageLoad = async (event) => {
  const data = await event.parent();
  await warm(data.queryClient, list({ fetch: event.fetch }));
};
