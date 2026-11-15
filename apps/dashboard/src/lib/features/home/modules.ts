import type { Component, Snippet } from "svelte";
import type { Permission } from "@template/core/permission";
import ChartLine from "@lucide/svelte/icons/chart-line";
import Files from "@lucide/svelte/icons/files";
import FolderKanban from "@lucide/svelte/icons/folder-kanban";
import ListTodo from "@lucide/svelte/icons/list-todo";
import Gauge from "@lucide/svelte/icons/gauge";

// What the home shows per role. Reaching a module is still enforced by its route.

const modules = {
  projects: {
    href: "/projects",
    label: "Projects",
    hint: "Group work into spaces",
    icon: FolderKanban,
  },
  todos: { href: "/todos", label: "Todos", hint: "The board and the list", icon: ListTodo },
  files: {
    href: "/files",
    label: "Files",
    hint: "Everything attached, in one place",
    icon: Files,
  },
  insights: {
    href: "/insights",
    label: "Insights",
    hint: "Trends once the dust settles",
    icon: ChartLine,
  },
  admin: { href: "/admin", label: "Admin", hint: "Users, logs and the instance", icon: Gauge },
} satisfies Record<string, { href: string; label: string; hint: string; icon: Component }>;

/** Widget slots. The route fills each with a snippet, so this slice imports no other. */
export type Key = "status" | "recent" | "shortcuts";

type Config = { modules: (keyof typeof modules)[]; widgets: Key[] };

/** What a role gets when `pages` says nothing about it, field by field. */
const base: Config = {
  modules: ["todos", "projects", "files", "insights"],
  widgets: ["status", "recent", "shortcuts"],
};

/** Per-role overrides of `base`. Leave a field out to inherit it. */
const pages: { [R in Permission.Role]?: Partial<Config> } = {
  admin: { modules: ["todos", "projects", "files", "insights", "admin"] },
};

export type Module = (typeof modules)[keyof typeof modules] & { key: keyof typeof modules };
export type Widget = { key: Key; title: string; hint?: string; body: Snippet };
/** What every home layout takes. */
export type Props = { modules: Module[]; widgets: Widget[] };

/** A role's home, resolved against `base`, with the route's widget bodies slotted in. */
export function page(role: Permission.Role, widgets: Record<Key, Omit<Widget, "key">>): Props {
  const cfg = { ...base, ...pages[role] };
  return {
    modules: cfg.modules.map((key) => ({ key, ...modules[key] })),
    widgets: cfg.widgets.map((key) => ({ key, ...widgets[key] })),
  };
}
