import AppWindow from "@lucide/svelte/icons/app-window";
import Gauge from "@lucide/svelte/icons/gauge";
import KeyRound from "@lucide/svelte/icons/key-round";
import LayoutDashboard from "@lucide/svelte/icons/layout-dashboard";
import LogOut from "@lucide/svelte/icons/log-out";
import MessageSquare from "@lucide/svelte/icons/message-square";
import ScrollText from "@lucide/svelte/icons/scroll-text";
import Sparkles from "@lucide/svelte/icons/sparkles";
import UserRound from "@lucide/svelte/icons/user-round";
import UsersRound from "@lucide/svelte/icons/users-round";
import Webhook from "@lucide/svelte/icons/webhook";
import { section } from "#lib/components/layout/nav.ts";
import type { LayoutLoad } from "./$types";

// `data` is the server load's output: this load shadows it, so it only reaches `page.data` through the spread.
export const load: LayoutLoad = ({ data }) => {
  const workspace = [
    ...(data.admin ? [{ href: "/settings/members", label: "Members", icon: UsersRound }] : []),
    ...(data.apps
      ? [
          { href: "/settings/apps", label: "Apps", icon: AppWindow },
          { href: "/settings/webhooks", label: "Webhooks", icon: Webhook },
        ]
      : []),
    ...(data.admin
      ? [
          { href: "/settings/panels", label: "Panels", icon: LayoutDashboard },
          { href: "/settings/feedback", label: "Feedback", icon: MessageSquare },
          { href: "/settings/logs", label: "Logs", icon: ScrollText },
          { href: "/settings/instance", label: "Instance", icon: Gauge },
        ]
      : []),
  ];
  return {
    ...data,
    nav: section(
      "/settings",
      "Settings",
      [
        {
          title: "You",
          items: [
            { href: "/settings/account", label: "Account", icon: UserRound },
            { href: "/settings/experience", label: "Experience", icon: Sparkles },
            { href: "/settings/keys", label: "API keys", icon: KeyRound },
          ],
        },
        ...(workspace.length ? [{ title: "Workspace", items: workspace }] : []),
      ],
      [{ title: "Other", items: [{ href: "/logout", label: "Sign out", icon: LogOut }] }],
    ),
  };
};
