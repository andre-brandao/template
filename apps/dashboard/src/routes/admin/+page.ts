import { events, stats } from "$lib/features/admin/api/admin.query";
import { warm } from "$lib/query";
import type { PageLoad } from "./$types";

export const load: PageLoad = async (event) => {
  const data = await event.parent();
  await warm(data.queryClient, stats(), events({ page: 1, pageSize: 1 }));
};
