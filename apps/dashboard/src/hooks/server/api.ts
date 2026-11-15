import type { Handle } from "@sveltejs/kit";
import { embed } from "@template/functions/api";

// Ahead of routing: `/api` never reaches SvelteKit. Runs after `auth`, so the session's
// Identity is already entered and the router needs no bearer.
export const api: Handle = ({ event, resolve }) =>
  event.url.pathname.startsWith("/api/") ? embed.fetch(event.request) : resolve(event);
