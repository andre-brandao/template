import type { SortingState } from "@tanstack/svelte-table";

/** Client-side order for the short lists here; `DataTable` ships no sorted row model. */
export function order<T>(
  rows: T[],
  sorting: SortingState,
  keys: Record<string, (row: T) => string | number>,
) {
  const by = sorting[0];
  const key = by && keys[by.id];
  if (!by || !key) return rows;
  return [...rows].sort((a, b) => {
    const x = key(a);
    const y = key(b);
    const n = x < y ? -1 : x > y ? 1 : 0;
    return by.desc ? -n : n;
  });
}
