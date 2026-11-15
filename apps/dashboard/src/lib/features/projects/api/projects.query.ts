import { createMutation, keepPreviousData } from "@tanstack/svelte-query";
import {
  deleteProjectByIdLinkMutation,
  deleteProjectByIdMutation,
  getProjectByIdOptions,
  getProjectOptions,
  getProjectQueryKey,
  patchProjectByIdMutation,
  postProjectByIdLinkMutation,
  postProjectMutation,
} from "@template/sdk/query";

// Lists and rows both carry the tag, so a write to one project refreshes everything showing it.
const project = [{ tags: ["Project"] }];

// A new search keeps the old rows on screen until its results land.
export const list = (q?: string) => ({
  ...getProjectOptions({ query: { search: q || undefined, pageSize: 100 } }),
  placeholderData: keepPreviousData,
});

export const get = (id: string) => getProjectByIdOptions({ path: { id } });

export const create = (opts?: Pick<ReturnType<typeof postProjectMutation>, "onSuccess">) =>
  createMutation(() => ({
    ...postProjectMutation(),
    meta: { invalidates: [getProjectQueryKey()] },
    ...opts,
  }));

export const update = (opts?: Pick<ReturnType<typeof patchProjectByIdMutation>, "onSuccess">) =>
  createMutation(() => ({
    ...patchProjectByIdMutation(),
    meta: { invalidates: [project] },
    ...opts,
  }));

export const remove = (opts?: Pick<ReturnType<typeof deleteProjectByIdMutation>, "onSuccess">) =>
  createMutation(() => ({
    ...deleteProjectByIdMutation(),
    meta: { invalidates: [getProjectQueryKey()] },
    ...opts,
  }));

export const link = (opts?: Pick<ReturnType<typeof postProjectByIdLinkMutation>, "onSuccess">) =>
  createMutation(() => ({
    ...postProjectByIdLinkMutation(),
    meta: { invalidates: [project] },
    ...opts,
  }));

export const unlink = (
  opts?: Pick<ReturnType<typeof deleteProjectByIdLinkMutation>, "onSuccess">,
) =>
  createMutation(() => ({
    ...deleteProjectByIdLinkMutation(),
    meta: { invalidates: [project] },
    ...opts,
  }));
