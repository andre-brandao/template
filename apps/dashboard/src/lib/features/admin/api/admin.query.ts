import { keepPreviousData } from "@tanstack/svelte-query";
import { call } from "#lib/query.ts";
import { getEvents, getFacets, getStats, getUsers } from "./admin.remote";

// Admin data has no API route: remote functions behind plain array keys. The role and
// access forms stay `remote.form` for their field issues and `invalidate(["users"])`.
// A new page or filter keeps the old rows up until the next ones land.
export const users = (args: Parameters<typeof getUsers>[0]) => ({
  queryKey: ["users", args],
  queryFn: call(() => getUsers(args)),
  placeholderData: keepPreviousData,
});

export const events = (args: Parameters<typeof getEvents>[0]) => ({
  queryKey: ["events", args],
  queryFn: call(() => getEvents(args)),
  placeholderData: keepPreviousData,
});

// Event types and sources only grow, and slowly.
export const facets = () => ({
  queryKey: ["events", "facets"],
  queryFn: call(() => getFacets()),
  staleTime: 5 * 60_000,
});

export const stats = () => ({ queryKey: ["stats"], queryFn: call(() => getStats()) });
