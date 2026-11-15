import { users } from "$lib/features/admin/api/admin.query";
import { users as filters } from "$lib/features/admin/filters";
import { warm } from "$lib/query";
import { parse } from "$lib/utils/params";
import type { PageLoad } from "./$types";

export const load: PageLoad = async (event) => {
  const data = await event.parent();
  await warm(data.queryClient, users(filters.args(parse(filters.schema, event.url))));
};
