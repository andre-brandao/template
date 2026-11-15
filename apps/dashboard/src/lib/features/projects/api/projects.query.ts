import { invalidate as rerun } from "$app/navigation";
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
import { invalidate, type Ctx, type Opts } from "$lib/query";

// Lists and rows both carry the tag, so a write to one project refreshes everything showing it.
// Its Logs timeline sits under `events`, so the new entry shows too.
const project = [{ tags: ["Project"] }];
// The stage picker groups by project name, so a rename or delete reshapes its options.
const labels = ["todos", "labels"];
const touched = [project, ["events"], labels];

// A new search keeps the old rows on screen until its results land.
export const list = (q?: string, ctx?: Ctx) => ({
  ...getProjectOptions({ ...ctx, query: { search: q || undefined, pageSize: 100 } }),
  placeholderData: keepPreviousData,
});

export const get = (id: string, ctx?: Ctx) => getProjectByIdOptions({ ...ctx, path: { id } });

/** For a write outside the SDK, like the avatar upload. */
export const refresh = () => invalidate(project);

export const create = (opts?: Opts<typeof postProjectMutation>) =>
  createMutation(() => ({
    ...postProjectMutation(),
    meta: { invalidates: [getProjectQueryKey()] },
    ...opts,
  }));

// The layout's crumbs carry the name, so its load reruns after the cache has the new one.
export const update = (opts?: Opts<typeof patchProjectByIdMutation>) =>
  createMutation(() => ({
    ...patchProjectByIdMutation(),
    meta: { invalidates: touched },
    onSuccess: (data, vars, result, ctx) =>
      Promise.all([rerun(`project:${vars.path.id}`), opts?.onSuccess?.(data, vars, result, ctx)]),
  }));

export const remove = (opts?: Opts<typeof deleteProjectByIdMutation>) =>
  createMutation(() => ({
    ...deleteProjectByIdMutation(),
    meta: { invalidates: [getProjectQueryKey(), labels] },
    ...opts,
  }));

export const link = (opts?: Opts<typeof postProjectByIdLinkMutation>) =>
  createMutation(() => ({
    ...postProjectByIdLinkMutation(),
    meta: { invalidates: touched },
    ...opts,
  }));

export const unlink = (opts?: Opts<typeof deleteProjectByIdLinkMutation>) =>
  createMutation(() => ({
    ...deleteProjectByIdLinkMutation(),
    meta: { invalidates: touched },
    ...opts,
  }));
