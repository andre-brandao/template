import { createMutation } from "@tanstack/svelte-query";
import {
  deleteKeyByIdMutation,
  getKeyOptions,
  getKeyQueryKey,
  postKeyMutation,
} from "@template/sdk/query";

// The caller's own keys are public API. A minted secret lives only in mutation data; `gcTime: 0` drops it on unmount.
export const keys = () => getKeyOptions();

export const mint = (opts?: Pick<ReturnType<typeof postKeyMutation>, "onSuccess">) =>
  createMutation(() => ({
    ...postKeyMutation(),
    gcTime: 0,
    meta: { invalidates: [getKeyQueryKey()] },
    ...opts,
  }));

export const revoke = (opts?: Pick<ReturnType<typeof deleteKeyByIdMutation>, "onSuccess">) =>
  createMutation(() => ({
    ...deleteKeyByIdMutation(),
    meta: { invalidates: [getKeyQueryKey()] },
    ...opts,
  }));
