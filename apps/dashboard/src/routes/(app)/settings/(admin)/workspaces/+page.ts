import { mode, registry } from "#lib/features/workspaces/api/workspaces.query.ts";
import { warm } from "#lib/query.ts";
import type { PageLoad } from "./$types";

export const load: PageLoad = async (event) => {
  const data = await event.parent();
  await warm(data.queryClient, mode(), registry());
};
