import { page } from "$app/state";
import type { LucideIcon } from "@lucide/svelte";

export type Item = { href: string; label: string; icon?: LucideIcon; exact?: boolean };

/**
 * Whether a nav item is the current page. Prefix matching keeps a parent lit on its
 * children; `exact` is for index routes that would otherwise never turn off.
 */
export function at(item: Item) {
  const hit = item.exact
    ? page.url.pathname === item.href
    : page.url.pathname.startsWith(item.href);
  return hit ? "page" : undefined;
}
