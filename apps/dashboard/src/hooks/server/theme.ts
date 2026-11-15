import type { Handle } from "@sveltejs/kit";
import * as store from "$lib/server/theme";

// Read inside the callback, not before `resolve` — the root layout's load reconciles the
// cookie against the database, and `transformPageChunk` runs late enough to see that.
export const theme: Handle = ({ event, resolve }) =>
  resolve(event, {
    transformPageChunk: ({ html }) => html.replace("%theme%", store.read(event)),
    // The query SDK reads these off a load's `/api` fetch; SvelteKit throws unless allowed.
    filterSerializedResponseHeaders: (name) => name === "content-type" || name === "content-length",
  });
