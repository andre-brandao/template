import { z } from "zod";
import type { SortingState } from "@tanstack/svelte-table";

/**
 * URL-backed sort state for a table: signed keys in the query string (`-dueDate`), the shape
 * TanStack wants in memory. Pass the unsigned keys a core list fn accepts — both directions
 * are derived, and anything else in the URL collapses to no sort rather than reaching core.
 */
export function sorted<K extends string>(keys: readonly [K, ...K[]]) {
  const signed = keys.flatMap((key) => [key, `-${key}`]) as [K | `-${K}`, ...(K | `-${K}`)[]];
  type Signed = K | `-${K}`;
  return {
    schema: z.enum(signed).array().default([]),
    decode: (list: Signed[]): SortingState =>
      list.map((raw) => ({ id: raw.replace(/^-/, ""), desc: raw.startsWith("-") })),
    encode: (state: SortingState) =>
      state.map((one) => (one.desc ? `-${one.id}` : one.id)) as Signed[],
  };
}
