import AppWindow from "@lucide/svelte/icons/app-window";
import KeyRound from "@lucide/svelte/icons/key-round";
import Webhook from "@lucide/svelte/icons/webhook";
import { section } from "$lib/components/layout/nav";
import type { LayoutLoad } from "./$types";

// `data` is the server load's output: this load shadows it, so it only reaches `page.data` through the spread.
export const load: LayoutLoad = ({ data }) => ({
  ...data,
  nav: section("/developers", "Developers", [
    {
      title: "You",
      items: [{ href: "/developers/keys", label: "API keys", icon: KeyRound }],
    },
    // Admin-only for now: an App's account and a webhook both see the whole workspace.
    ...(data.admin
      ? [
          {
            title: "Workspace",
            items: [
              { href: "/developers/apps", label: "Apps", icon: AppWindow },
              { href: "/developers/webhooks", label: "Webhooks", icon: Webhook },
            ],
          },
        ]
      : []),
  ]),
});
