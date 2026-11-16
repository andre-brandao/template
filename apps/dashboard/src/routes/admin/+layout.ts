import Gauge from "@lucide/svelte/icons/gauge";
import LayoutDashboard from "@lucide/svelte/icons/layout-dashboard";
import MessageSquare from "@lucide/svelte/icons/message-square";
import ScrollText from "@lucide/svelte/icons/scroll-text";
import Building from "@lucide/svelte/icons/building-2";
import UsersRound from "@lucide/svelte/icons/users-round";
import { section } from "#lib/components/layout/nav.ts";

export const load = () => ({
  nav: section("/admin", "Admin", [
    {
      title: "Instance",
      items: [
        { href: "/admin", label: "Overview", icon: Gauge, exact: true },
        { href: "/admin/users", label: "Users", icon: UsersRound },
        { href: "/admin/workspaces", label: "Workspaces", icon: Building },
        { href: "/admin/logs", label: "Logs", icon: ScrollText },
        { href: "/admin/panels", label: "Panels", icon: LayoutDashboard },
        { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
      ],
    },
  ]),
});
