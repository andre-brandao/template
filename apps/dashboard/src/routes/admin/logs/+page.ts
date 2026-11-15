import { events } from "$lib/features/admin/api/admin.query";
import { filters } from "$lib/features/admin/filters";
import { warm } from "$lib/query";
import { parse } from "$lib/utils/params";
import type { PageLoad } from "./$types";

export const load: PageLoad = async (event) => {
  const data = await event.parent();
  await warm(
    data.queryClient,
    events(filters.events.args(parse(filters.events.schema, event.url))),
  );
};
