import { createMutation } from "@tanstack/svelte-query";
import {
  deleteKeyByIdMutation,
  getKeyOptions,
  getKeyQueryKey,
  postKeyMutation,
} from "@template/sdk/query";
import type { Opts } from "$lib/query";

// The caller's own keys are public API. A minted secret lives only in mutation data; `gcTime: 0` drops it on unmount.
export const list = () => getKeyOptions();

export const create = (opts?: Opts<typeof postKeyMutation>) =>
  createMutation(() => ({
    ...postKeyMutation(),
    gcTime: 0,
    meta: { invalidates: [getKeyQueryKey()] },
    ...opts,
  }));

export const remove = (opts?: Opts<typeof deleteKeyByIdMutation>) =>
  createMutation(() => ({
    ...deleteKeyByIdMutation(),
    meta: { invalidates: [getKeyQueryKey()] },
    ...opts,
  }));
