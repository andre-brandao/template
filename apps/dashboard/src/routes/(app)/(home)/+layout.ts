import ChartLine from "@lucide/svelte/icons/chart-line";
import Files from "@lucide/svelte/icons/files";
import FolderKanban from "@lucide/svelte/icons/folder-kanban";
import ListTodo from "@lucide/svelte/icons/list-todo";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = () => ({
  nav: {
    sections: {
      top: [
        {
          items: [
            { href: "/projects", label: "Projects", icon: FolderKanban },
            { href: "/todos", label: "Todos", icon: ListTodo },
            { href: "/files", label: "Files", icon: Files },
            { href: "/insights", label: "Insights", icon: ChartLine },
          ],
        },
      ],
    },
  },
});
