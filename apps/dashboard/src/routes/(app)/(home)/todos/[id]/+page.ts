import { timeline } from "#lib/features/events/api/events.query.ts";
import { detail } from "#lib/features/todos/api/todos.query.ts";
import { warm } from "#lib/query.ts";
import type { PageLoad } from "./$types";

// The editor's Logs sit above the fold, so its timeline warms with the row.
export const load: PageLoad = async (event) => {
  const data = await event.parent();
  const id = event.params.id;
  await warm(data.queryClient, ...detail(id, { fetch: event.fetch }), timeline("todo", id));
};
