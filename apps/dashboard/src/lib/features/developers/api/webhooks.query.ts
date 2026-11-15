import { createMutation } from "@tanstack/svelte-query";
import type { Webhook } from "@template/core/webhook";
import { call, type Done } from "$lib/query";
import { createWebhook, getWebhooks, removeWebhook, updateWebhook } from "./webhooks.remote";

// Every subscription, or one App's. Both sit under `webhooks`, so one key reaches all of them.
export const hooks = (owner?: string) => ({
  queryKey: ["webhooks", { owner }],
  queryFn: call(() => getWebhooks(owner)),
});

export const subscribe = (opts?: Done<typeof createWebhook>) =>
  createMutation(() => ({
    mutationFn: call(createWebhook),
    meta: { invalidates: [["webhooks"]] },
    ...opts,
  }));

// A row may sit in several lists (all, and its App's), so each one gets the patched row.
export const update = (opts?: Done<typeof updateWebhook>) =>
  createMutation(() => ({
    mutationFn: call(updateWebhook),
    meta: { invalidates: [] },
    onSuccess: (data: Webhook.Info, _vars, _result, ctx) =>
      ctx.client.setQueriesData<Webhook.Info[]>({ queryKey: ["webhooks"] }, (rows) =>
        rows?.map((row) => (row.id === data.id ? data : row)),
      ),
    ...opts,
  }));

export const unsubscribe = (opts?: Done<typeof removeWebhook>) =>
  createMutation(() => ({
    mutationFn: call(removeWebhook),
    meta: { invalidates: [["webhooks"]] },
    ...opts,
  }));
