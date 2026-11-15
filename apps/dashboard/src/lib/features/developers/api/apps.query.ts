import { createMutation } from "@tanstack/svelte-query";
import { call, read, type Done } from "#lib/query.ts";
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
export const list = () => ({ queryKey: ["apps"], queryFn: read(() => getApps()) });

export const get = (id: string) => ({ queryKey: ["app", id], queryFn: read(() => getApp(id)) });

export const keys = (id: string) => ({
  queryKey: ["app", id, "keys"],
  queryFn: read(() => getAppKeys(id)),
});

// Server config under its own root, so no `app` write refetches it.
export const endpoint = (id: string) => ({
  queryKey: ["endpoint", id],
  queryFn: read(() => getEndpoint(id)),
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

export const mint = (opts?: Done<typeof createAppKey>) =>
  createMutation(() => ({
    mutationFn: call(createAppKey),
    gcTime: 0,
    meta: { invalidates: [["app"]] },
    ...opts,
  }));

export const revoke = (opts?: Done<typeof revokeAppKey>) =>
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
