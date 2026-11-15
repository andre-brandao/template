import { createMutation } from "@tanstack/svelte-query";
import {
  deleteAppByIdKeyByKeyMutation,
  deleteAppByIdMutation,
  deleteKeyByIdMutation,
  deleteWebhookByIdMutation,
  getAppByIdKeyOptions,
  getAppByIdOptions,
  getAppOptions,
  getAppQueryKey,
  getKeyOptions,
  getKeyQueryKey,
  getWebhookOptions,
  getWebhookQueryKey,
  patchAppByIdMutation,
  patchWebhookByIdMutation,
  postAppByIdKeyMutation,
  postAppByIdSecretMutation,
  postAppMutation,
  postKeyMutation,
  postWebhookMutation,
} from "@template/sdk/query";

// An App's list, row and keys all carry the tag, so a write to one App refreshes all of them.
// Minted keys and secrets come back in the mutation's data only, never into a query.
const tag = [{ tags: ["App"] }];

export const keys = () => getKeyOptions();

export const apps = () => getAppOptions();

export const app = (id: string) => getAppByIdOptions({ path: { id } });

export const owned = (id: string) => getAppByIdKeyOptions({ path: { id } });

export const hooks = (owner?: string) => getWebhookOptions({ query: { owner } });

export const mint = (opts?: Pick<ReturnType<typeof postKeyMutation>, "onSuccess">) =>
  createMutation(() => ({
    ...postKeyMutation(),
    meta: { invalidates: [getKeyQueryKey()] },
    ...opts,
  }));

export const revoke = (opts?: Pick<ReturnType<typeof deleteKeyByIdMutation>, "onSuccess">) =>
  createMutation(() => ({
    ...deleteKeyByIdMutation(),
    meta: { invalidates: [getKeyQueryKey()] },
    ...opts,
  }));

export const create = (opts?: Pick<ReturnType<typeof postAppMutation>, "onSuccess">) =>
  createMutation(() => ({
    ...postAppMutation(),
    meta: { invalidates: [getAppQueryKey()] },
    ...opts,
  }));

export const rename = (opts?: Pick<ReturnType<typeof patchAppByIdMutation>, "onSuccess">) =>
  createMutation(() => ({
    ...patchAppByIdMutation(),
    meta: { invalidates: [tag] },
    ...opts,
  }));

// Its webhooks go with it. Not the tag: the App's own row would refetch into a 404.
export const remove = (opts?: Pick<ReturnType<typeof deleteAppByIdMutation>, "onSuccess">) =>
  createMutation(() => ({
    ...deleteAppByIdMutation(),
    meta: { invalidates: [getAppQueryKey(), getWebhookQueryKey()] },
    ...opts,
  }));

export const issue = (opts?: Pick<ReturnType<typeof postAppByIdKeyMutation>, "onSuccess">) =>
  createMutation(() => ({
    ...postAppByIdKeyMutation(),
    meta: { invalidates: [tag] },
    ...opts,
  }));

export const retire = (
  opts?: Pick<ReturnType<typeof deleteAppByIdKeyByKeyMutation>, "onSuccess">,
) =>
  createMutation(() => ({
    ...deleteAppByIdKeyByKeyMutation(),
    meta: { invalidates: [tag] },
    ...opts,
  }));

// Flips the App's `inbound`, so its rows refetch.
export const rotate = (opts?: Pick<ReturnType<typeof postAppByIdSecretMutation>, "onSuccess">) =>
  createMutation(() => ({
    ...postAppByIdSecretMutation(),
    meta: { invalidates: [tag] },
    ...opts,
  }));

export const subscribe = (opts?: Pick<ReturnType<typeof postWebhookMutation>, "onSuccess">) =>
  createMutation(() => ({
    ...postWebhookMutation(),
    meta: { invalidates: [getWebhookQueryKey()] },
    ...opts,
  }));

// A row may sit in several lists (all, and its App's), so each one gets the patched row.
export const toggle = (opts?: Pick<ReturnType<typeof patchWebhookByIdMutation>, "onSuccess">) =>
  createMutation(() => ({
    ...patchWebhookByIdMutation(),
    meta: { invalidates: [] },
    onSuccess: (data, _vars, _result, ctx) =>
      ctx.client.setQueriesData<(typeof data)[]>({ queryKey: getWebhookQueryKey() }, (rows) =>
        rows?.map((row) => (row.id === data.id ? data : row)),
      ),
    ...opts,
  }));

export const unsubscribe = (
  opts?: Pick<ReturnType<typeof deleteWebhookByIdMutation>, "onSuccess">,
) =>
  createMutation(() => ({
    ...deleteWebhookByIdMutation(),
    meta: { invalidates: [getWebhookQueryKey()] },
    ...opts,
  }));
