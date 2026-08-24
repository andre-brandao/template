import type { Handle } from "@sveltejs/kit";
import * as store from "$lib/server/theme";

// Read inside the callback, not before `resolve` — the root layout's load reconciles the
// cookie against the database, and `transformPageChunk` runs late enough to see that.
export const theme: Handle = ({ event, resolve }) =>
  resolve(event, {
    transformPageChunk: ({ html }) => html.replace("%theme%", store.read(event)),
  });
