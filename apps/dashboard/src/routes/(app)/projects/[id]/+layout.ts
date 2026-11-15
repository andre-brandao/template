import { error } from "@sveltejs/kit";
import ChartLine from "@lucide/svelte/icons/chart-line";
import LayoutDashboard from "@lucide/svelte/icons/layout-dashboard";
import ListTodo from "@lucide/svelte/icons/list-todo";
import Settings from "@lucide/svelte/icons/settings";
import { getProjectByIdOptions, getProjectQueryKey, type Project } from "@template/sdk/query";
import Head from "./Head.svelte";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = async (event) => {
  // A rename reruns this through `update`, so the crumbs follow the new name.
  event.depends(`project:${event.params.id}`);
  const data = await event.parent();
  // Seeded from any cached list, and a cached row returns at once (the page refreshes it),
  // so only a cold open waits. Same origin as the browser client, so the keys match.
  const listed = data.queryClient
    .getQueriesData<{ data: Project[] }>({ queryKey: getProjectQueryKey() })
    .flatMap((entry) => entry[1]?.data ?? [])
    .find((one) => one.id === event.params.id);
  const project = await data.queryClient
    .ensureQueryData({
      ...getProjectByIdOptions({
        path: { id: event.params.id },
        baseUrl: `${event.url.origin}/api`,
        fetch: event.fetch,
      }),
      initialData: listed,
      // Stale on arrival, so the page refetches the full row behind the seed.
      initialDataUpdatedAt: 0,
      revalidateIfStale: true,
    })
    .catch(() => error(404, "Not found"));
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
