import { invalidate } from "$app/navigation";
import { createMutation } from "@tanstack/svelte-query";
import type { Patch } from "@template/core/user/prefs";
import { save } from "./prefs.remote";

// Prefs ride the root load, not a query: refresh that one load and leave the cache alone.
export const update = () =>
  createMutation(() => ({
    mutationFn: (patch: Patch) => save(patch),
    meta: { invalidates: [] },
    onSuccess: () => invalidate("app:prefs"),
  }));
