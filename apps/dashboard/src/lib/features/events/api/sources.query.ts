import { browser } from "$app/env";
import { read } from "#lib/query.ts";
import { getSource } from "./sources.remote";

export const label = (source?: string, sourceID?: string) => ({
  queryKey: ["source", { source, sourceID }],
  queryFn: read(() => getSource({ source: source ?? "", sourceID: sourceID ?? "" })),
  enabled: browser && !!source && !!sourceID,
});
