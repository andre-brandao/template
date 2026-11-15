import { createMutation } from "@tanstack/svelte-query";
import {
  deleteFileByNameMutation,
  getFileOptions,
  getFileQueryKey,
  patchFileByNameMutation,
  postFileMutation,
} from "@template/sdk/query";
import type { Ctx, Opts } from "$lib/query";

export const list = (ctx?: Ctx) => getFileOptions(ctx);

export const upload = (opts?: Opts<typeof postFileMutation>) =>
  createMutation(() => ({
    ...postFileMutation(),
    meta: { invalidates: [getFileQueryKey()] },
    ...opts,
  }));

export const rename = (opts?: Opts<typeof patchFileByNameMutation>) =>
  createMutation(() => ({
    ...patchFileByNameMutation(),
    meta: { invalidates: [getFileQueryKey()] },
    ...opts,
  }));

export const remove = (opts?: Opts<typeof deleteFileByNameMutation>) =>
  createMutation(() => ({
    ...deleteFileByNameMutation(),
    meta: { invalidates: [getFileQueryKey()] },
    ...opts,
  }));
