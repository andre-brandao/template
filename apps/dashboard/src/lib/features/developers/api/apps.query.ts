import { createMutation } from "@tanstack/svelte-query";
import { call, type Done } from "$lib/query";
import {
  createApp,
  createAppKey,
  getApp,
  getAppKeys,
  getApps,
  getEndpoint,
  removeApp,
  renameApp,
  revokeAppKey,
  rotateSecret,
} from "./apps.remote";

// `apps` is the list, `app` one App and its keys: separate roots, so a delete never refetches its own row.
// Minted keys and secrets live only in mutation data; `gcTime: 0` drops it on unmount.
export const apps = () => ({ queryKey: ["apps"], queryFn: call(() => getApps()) });

export const app = (id: string) => ({ queryKey: ["app", id], queryFn: call(() => getApp(id)) });

export const owned = (id: string) => ({
  queryKey: ["app", id, "keys"],
  queryFn: call(() => getAppKeys(id)),
});

// Server config, so it never changes under a page.
export const endpoint = (id: string) => ({
  queryKey: ["app", id, "endpoint"],
  queryFn: call(() => getEndpoint(id)),
  staleTime: Infinity,
});

export const create = (opts?: Done<typeof createApp>) =>
  createMutation(() => ({
    mutationFn: call(createApp),
    meta: { invalidates: [["apps"]] },
    ...opts,
  }));

export const rename = (opts?: Done<typeof renameApp>) =>
  createMutation(() => ({
    mutationFn: call(renameApp),
    meta: { invalidates: [["apps"], ["app"]] },
    ...opts,
  }));

// Its webhooks go with it.
export const remove = (opts?: Done<typeof removeApp>) =>
  createMutation(() => ({
    mutationFn: call(removeApp),
    meta: { invalidates: [["apps"], ["webhooks"]] },
    ...opts,
  }));

export const issue = (opts?: Done<typeof createAppKey>) =>
  createMutation(() => ({
    mutationFn: call(createAppKey),
    gcTime: 0,
    meta: { invalidates: [["app"]] },
    ...opts,
  }));

export const retire = (opts?: Done<typeof revokeAppKey>) =>
  createMutation(() => ({
    mutationFn: call(revokeAppKey),
    meta: { invalidates: [["app"]] },
    ...opts,
  }));

// Flips the App's `inbound`, so its rows refetch.
export const rotate = (opts?: Done<typeof rotateSecret>) =>
  createMutation(() => ({
    mutationFn: call(rotateSecret),
    gcTime: 0,
    meta: { invalidates: [["apps"], ["app"]] },
    ...opts,
  }));
