import { call } from "$lib/query";
import { getIssue, getIssues, getMine } from "./feedback.remote";

// Internal only, so plain keys: `['feedback']` hits all three, `['feedback', 'mine']` the sender's.
export const mine = () => ({ queryKey: ["feedback", "mine"], queryFn: call(() => getMine()) });

export const issues = (filter: Parameters<typeof getIssues>[0]) => ({
  queryKey: ["feedback", filter],
  queryFn: call(() => getIssues(filter)),
});

export const issue = (id: number) => ({
  queryKey: ["feedback", id],
  queryFn: call(() => getIssue(id)),
});
