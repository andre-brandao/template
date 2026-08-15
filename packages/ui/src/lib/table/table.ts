import { rowExpandingFeature, rowSortingFeature, tableFeatures } from "@tanstack/svelte-table";

/**
 * The feature set `DataTable` renders for — build tables with this so the types line up.
 * `Table<...>` is invariant in its features, and the permissive `any` mode cannot resolve
 * behind a generic, so the component has to name a concrete set rather than accept any.
 *
 * No sorted row model on purpose: ordering is the caller's business, which in this app
 * means `manualSorting` and a core `order()` clause. Expanding carries no row model either
 * — nothing here has sub-rows, it drives the `detail` row under an expanded one.
 */
export const features = tableFeatures({ rowSortingFeature, rowExpandingFeature });

export type Features = typeof features;
