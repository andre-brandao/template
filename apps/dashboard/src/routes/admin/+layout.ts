import Gauge from "@lucide/svelte/icons/gauge";
import HardDrive from "@lucide/svelte/icons/hard-drive";
import ScrollText from "@lucide/svelte/icons/scroll-text";
import UsersRound from "@lucide/svelte/icons/users-round";
import Webhook from "@lucide/svelte/icons/webhook";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = ({ data }) => ({
  ...data,
  nav: {
    root: "/admin",
    fallback: "/todos",
    back: { label: "Back" },
    crumbs: [
      { href: "/", label: "Home" },
      { href: "/admin", label: "Admin" },
    ],
    sections: {
      top: [
        {
          title: "Instance",
          items: [
            // `exact`, or prefix matching keeps Overview lit on every screen below it.
            { href: "/admin", label: "Overview", icon: Gauge, exact: true },
            { href: "/admin/users", label: "Users", icon: UsersRound },
            { href: "/admin/logs", label: "Logs", icon: ScrollText },
            { href: "/admin/webhooks", label: "Webhooks", icon: Webhook },
            { href: "/admin/database", label: "Database", icon: HardDrive },
          ],
        },
      ],
    },
  },
});
