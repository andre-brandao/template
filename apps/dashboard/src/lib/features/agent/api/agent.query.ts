import { createMutation, infiniteQueryOptions } from "@tanstack/svelte-query";
import { call, type Done } from "$lib/query";
import { getConversations, getModels, removeConversation } from "./agent.remote";

// The gateway's model list only changes on a deploy.
export const models = () => ({
  queryKey: ["models"],
  queryFn: call(() => getModels()),
  staleTime: Infinity,
});

export const conversations = () =>
  infiniteQueryOptions({
    queryKey: ["conversations"],
    queryFn: ({ pageParam }) => call(getConversations)(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last, all) => (last.more ? all.length + 1 : undefined),
  });

export const remove = (opts?: Done<typeof removeConversation>) =>
  createMutation(() => ({
    mutationFn: call(removeConversation),
    meta: { invalidates: [["conversations"]] },
    ...opts,
  }));
