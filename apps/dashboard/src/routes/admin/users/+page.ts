import { users } from "#lib/features/admin/api/admin.query.ts";
import { filters } from "#lib/features/admin/filters.ts";
import { warm } from "#lib/query.ts";
import { parse } from "#lib/utils/params.ts";
import type { PageLoad } from "./$types";

export const load: PageLoad = async (event) => {
  const data = await event.parent();
  await warm(data.queryClient, users(filters.users.args(parse(filters.users.schema, event.url))));
};
