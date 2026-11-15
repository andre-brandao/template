import { createMutation } from "@tanstack/svelte-query";
import { call, read, type Done } from "#lib/query.ts";
import { getTally, vote as cast } from "./experiments.remote";

// Internal only, so plain keys: `['experiment', key]` is one test's tally.
export const tally = (input: Parameters<typeof getTally>[0]) => ({
  queryKey: ["experiment", input.key],
  queryFn: read(() => getTally(input)),
});

export const vote = (opts?: Done<typeof cast>) =>
  createMutation(() => ({
    mutationFn: call(cast),
    meta: { invalidates: [["experiment"]] },
    ...opts,
  }));
