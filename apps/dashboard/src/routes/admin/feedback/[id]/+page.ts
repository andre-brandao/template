import { issue } from "$lib/features/feedback/api/feedback.query";
import { warm } from "$lib/query";
import type { PageLoad } from "./$types";

export const load: PageLoad = async (event) => {
  const data = await event.parent();
  await warm(data.queryClient, issue(Number(event.params.id)));
};
