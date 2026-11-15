import { getTodoOptions, getTodoStageOptions } from "@template/sdk/query";
import { warm } from "$lib/query";
import type { PageLoad } from "./$types";

// The facts and stage list sit above the fold; warmed here, SSR paints them instead of skeletons.
export const load: PageLoad = async (event) => {
  const data = await event.parent();
  const opts = { baseUrl: `${event.url.origin}/api`, fetch: event.fetch };
  const scope = { source: "project", sourceID: event.params.id };
  await warm(
    data.queryClient,
    getTodoOptions({ ...opts, query: { ...scope, pageSize: 100 } }),
    getTodoStageOptions({ ...opts, query: scope }),
  );
};
