import Gauge from "@lucide/svelte/icons/gauge";
import HardDrive from "@lucide/svelte/icons/hard-drive";
import LayoutDashboard from "@lucide/svelte/icons/layout-dashboard";
import ScrollText from "@lucide/svelte/icons/scroll-text";
import UsersRound from "@lucide/svelte/icons/users-round";
import { section } from "$lib/components/layout/nav";

export const load = () => ({
  nav: section("/admin", "Admin", [
    {
      title: "Instance",
      items: [
        { href: "/admin", label: "Overview", icon: Gauge, exact: true },
        { href: "/admin/users", label: "Users", icon: UsersRound },
        { href: "/admin/logs", label: "Logs", icon: ScrollText },
        { href: "/admin/database", label: "Database", icon: HardDrive },
        { href: "/admin/panels", label: "Panels", icon: LayoutDashboard },
      ],
    },
  ]),
});
