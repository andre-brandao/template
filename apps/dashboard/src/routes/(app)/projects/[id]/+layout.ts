import ChartLine from "@lucide/svelte/icons/chart-line";
import LayoutDashboard from "@lucide/svelte/icons/layout-dashboard";
import ListTodo from "@lucide/svelte/icons/list-todo";
import Settings from "@lucide/svelte/icons/settings";
import { getProjectByIdOptions } from "@template/sdk/query";
import Head from "./Head.svelte";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = async (event) => {
  const data = await event.parent();
  // Same origin as the browser client, so this lands under the key the page reads.
  const project = await data.queryClient.fetchQuery(
    getProjectByIdOptions({
      path: { id: event.params.id },
      baseUrl: `${event.url.origin}/api`,
      fetch: event.fetch,
    }),
  );
  const base = `/projects/${event.params.id}`;
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
              { href: `${base}/insights`, label: "Insights", icon: ChartLine },
            ],
          },
        ],
        bottom: [{ items: [{ href: `${base}/settings`, label: "Settings", icon: Settings }] }],
      },
    },
  };
};
