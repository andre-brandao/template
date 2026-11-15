import { browser } from "$app/env";
import { call } from "#lib/query.ts";
import { getSource } from "./sources.remote";

export const label = (source?: string, sourceID?: string) => ({
  queryKey: ["source", { source, sourceID }],
  queryFn: call(() => getSource({ source: source ?? "", sourceID: sourceID ?? "" })),
  enabled: browser && !!source && !!sourceID,
});
