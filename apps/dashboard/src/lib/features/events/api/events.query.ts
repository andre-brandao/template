import { call } from "$lib/query";
import { getEvents } from "./events.remote";

// Under `events`, so a slice's writes reach its timeline by key, without importing this.
export const timeline = (source: string, sourceID: string) => ({
  queryKey: ["events", { source, sourceID }],
  queryFn: call(() => getEvents({ source, sourceID })),
});
