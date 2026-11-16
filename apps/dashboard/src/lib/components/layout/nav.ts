import { page } from "$app/state";
import type { LucideIcon } from "@lucide/svelte";
import ChartLine from "@lucide/svelte/icons/chart-line";
import Files from "@lucide/svelte/icons/files";
import FolderKanban from "@lucide/svelte/icons/folder-kanban";
import ListTodo from "@lucide/svelte/icons/list-todo";
import type { Permission } from "@template/core/permission";
import type { Component } from "svelte";

export type Item = { href: string; label: string; icon?: LucideIcon; exact?: boolean };

export type Crumb = { href?: string; label: string };

export type Section = { title?: string; items: Item[] };

export type Nav = {
  crumbs?: Crumb[];
  /** `href` pins the target; without it back follows where the reader entered `root` from. */
  back?: { label: string; href?: string };
  root?: string;
  /** `bottom` is pinned to the foot of the rail. */
  sections: { top: Section[]; bottom?: Section[] };
  /** Sits in the rail above the menu; gets the collapsed flag. */
  head?: Component<{ tight: boolean }>;
};

/** `path` is `href` or below it, on a segment boundary: `/dev` never lights `/devtools`. */
export const under = (path: string, href: string) => path === href || path.startsWith(`${href}/`);

/** Whether a nav item is the current page; `exact` keeps an index from lighting its children. */
export function at(item: Item) {
  const hit = item.exact ? page.url.pathname === item.href : under(page.url.pathname, item.href);
  return hit ? "page" : undefined;
}

/** The home rail; the palette lists it from every section. */
export const home: Section[] = [
  {
    items: [
      { href: "/projects", label: "Projects", icon: FolderKanban },
      { href: "/todos", label: "Todos", icon: ListTodo },
      { href: "/files", label: "Files", icon: Files },
      { href: "/insights", label: "Insights", icon: ChartLine },
    ],
  },
];

/** The account menu's destinations; the palette lists them too. `grants` hides, never secures. */
export const account = (id: string): (Item & { grants?: Permission.Grants })[] => [
  { href: `/u/${id}`, label: "Profile" },
  { href: "/settings/account", label: "Settings" },
  { href: "/settings/keys", label: "API keys" },
  { href: "/settings/instance", label: "Admin", grants: { admin: ["read"] } },
];

/** A section with its own rail; back leads to wherever the reader came from. */
export const section = (root: string, label: string, top: Section[], bottom?: Section[]): Nav => ({
  root,
  back: { label: "Back" },
  crumbs: [
    { href: "/home", label: "Home" },
    { href: root, label },
  ],
  sections: { top, bottom },
});
