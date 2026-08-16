import CalendarDays from "@lucide/svelte/icons/calendar-days";
import ChartLine from "@lucide/svelte/icons/chart-line";
import LayoutDashboard from "@lucide/svelte/icons/layout-dashboard";
import ListTodo from "@lucide/svelte/icons/list-todo";
import Settings from "@lucide/svelte/icons/settings";
import { getProject } from "$lib/features/projects/api/projects.remote";
import Head from "./Head.svelte";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = async ({ params }) => {
  const project = await getProject(params.id);
  const base = `/projects/${params.id}`;
  return {
    nav: {
      back: { href: "/projects", label: "Projects" },
      head: Head,
      crumbs: [
        { href: "/", label: "Home" },
        { href: "/projects", label: "Projects" },
        { href: base, label: project.name },
      ],
      sections: {
        top: [
          {
            items: [
              { href: base, label: "Overview", exact: true, icon: LayoutDashboard },
              { href: `${base}/todos`, label: "Todos", icon: ListTodo },
              { href: `${base}/calendar`, label: "Calendar", icon: CalendarDays },
              { href: `${base}/insights`, label: "Insights", icon: ChartLine },
            ],
          },
        ],
        bottom: [{ items: [{ href: `${base}/settings`, label: "Settings", icon: Settings }] }],
      },
    },
  };
};
