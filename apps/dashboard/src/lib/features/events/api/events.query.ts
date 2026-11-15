import { read } from "#lib/query.ts";
import { getEvents } from "./events.remote";

// Under `events`, so a slice's writes reach its timeline by key, without importing this.
export const timeline = (source: string, sourceID: string) => ({
  queryKey: ["events", { source, sourceID }],
  queryFn: read(() => getEvents({ source, sourceID })),
});
