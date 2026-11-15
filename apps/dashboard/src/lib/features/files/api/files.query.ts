import { createMutation } from "@tanstack/svelte-query";
import {
  deleteFileByNameMutation,
  getFileOptions,
  getFileQueryKey,
  patchFileByNameMutation,
  postFileMutation,
} from "@template/sdk/query";

export const list = () => getFileOptions();

export const upload = (opts?: Pick<ReturnType<typeof postFileMutation>, "onSuccess">) =>
  createMutation(() => ({
    ...postFileMutation(),
    meta: { invalidates: [getFileQueryKey()] },
    ...opts,
  }));

export const rename = (opts?: Pick<ReturnType<typeof patchFileByNameMutation>, "onSuccess">) =>
  createMutation(() => ({
    ...patchFileByNameMutation(),
    meta: { invalidates: [getFileQueryKey()] },
    ...opts,
  }));

export const remove = (opts?: Pick<ReturnType<typeof deleteFileByNameMutation>, "onSuccess">) =>
  createMutation(() => ({
    ...deleteFileByNameMutation(),
    meta: { invalidates: [getFileQueryKey()] },
    ...opts,
  }));
