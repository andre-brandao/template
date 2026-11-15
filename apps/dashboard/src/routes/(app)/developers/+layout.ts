import AppWindow from "@lucide/svelte/icons/app-window";
import KeyRound from "@lucide/svelte/icons/key-round";
import Webhook from "@lucide/svelte/icons/webhook";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = ({ data }) => ({
  ...data,
  nav: {
    root: "/developers",
    fallback: "/todos",
    back: { label: "Back" },
    crumbs: [
      { href: "/", label: "Home" },
      { href: "/developers", label: "Developers" },
    ],
    sections: {
      top: [
        {
          title: "You",
          items: [{ href: "/developers/keys", label: "Personal access tokens", icon: KeyRound }],
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
      ],
    },
  },
});
