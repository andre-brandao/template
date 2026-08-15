import { page } from "$app/state";
import type { LucideIcon } from "@lucide/svelte";
import type { Component } from "svelte";

export type Item = { href: string; label: string; icon?: LucideIcon; exact?: boolean };

export type Crumb = { href?: string; label: string };

export type Section = { title?: string; items: Item[] };

export type Nav = {
  crumbs?: Crumb[];
  /** `href` pins the target; without it back follows where the reader entered `root` from. */
  back?: { label: string; href?: string };
  root?: string;
  fallback?: string;
  /** `bottom` is pinned to the foot of the rail. */
  sections: { top: Section[]; bottom?: Section[] };
  /** Sits in the rail above the menu; gets the collapsed flag. */
  head?: Component<{ tight: boolean }>;
};

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
