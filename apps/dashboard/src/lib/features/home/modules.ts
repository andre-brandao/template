import type { Component, Snippet } from "svelte";
import type { Permission } from "@template/core/permission";
import ChartLine from "@lucide/svelte/icons/chart-line";
import Files from "@lucide/svelte/icons/files";
import FolderKanban from "@lucide/svelte/icons/folder-kanban";
import ListTodo from "@lucide/svelte/icons/list-todo";
import Gauge from "@lucide/svelte/icons/gauge";

export type Module = {
  href: string;
  label: string;
  hint: string;
  icon: Component;
  /** Hides the tile without them; the module's route still enforces access. */
  grants?: Permission.Grants;
};

/** A home widget: the route composes the body, so this slice imports no other. */
export type Widget = { title: string; hint?: string; body: Snippet };

export const modules: Module[] = [
  { href: "/todos", label: "Todos", hint: "The board and the list", icon: ListTodo },
  { href: "/projects", label: "Projects", hint: "Group work into spaces", icon: FolderKanban },
  { href: "/files", label: "Files", hint: "Everything attached, in one place", icon: Files },
  { href: "/insights", label: "Insights", hint: "Trends once the dust settles", icon: ChartLine },
  {
    href: "/admin",
    label: "Admin",
    hint: "Users, logs and the instance",
    icon: Gauge,
    grants: { admin: ["read"] },
  },
];
