import { page } from "$app/state";
import type { LucideIcon } from "@lucide/svelte";

export type Item = { href: string; label: string; icon?: LucideIcon; exact?: boolean };

/**
 * Whether a nav item is the page being looked at. Shared so the lit link and the
 * breadcrumb trail can't disagree about which one that is: prefix matching keeps a
 * parent lit on its children, but an index route like /projects/[id] would then never
 * turn off — hence `exact`.
 */
export function at(item: Item) {
  const hit = item.exact
    ? page.url.pathname === item.href
    : page.url.pathname.startsWith(item.href);
  return hit ? "page" : undefined;
}
