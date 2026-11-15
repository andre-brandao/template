import { zone } from "@template/core/user/prefs";
import { last, today } from "@template/ui/day";
import { list, statuses } from "$lib/features/todos/api/todos.query";
import { warm } from "$lib/query";
import type { PageLoad } from "./$types";

// The Glance and Recent widgets' queries, with their exact args.
export const load: PageLoad = async (event) => {
  const data = await event.parent();
  const ctx = { fetch: event.fetch };
  await warm(data.queryClient, statuses(last(90, today(zone(data.prefs))), ctx), list({}, ctx));
};
