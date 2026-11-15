import AppWindow from "@lucide/svelte/icons/app-window";
import UserRound from "@lucide/svelte/icons/user-round";
import Webhook from "@lucide/svelte/icons/webhook";
import { getProfile } from "$lib/features/people/api/people.remote";
import type { LayoutLoad } from "./$types";

// An App sits under Developers → Apps; a person has no section, so back goes where they came from.
export const load: LayoutLoad = async (event) => {
  const profile = await getProfile(event.params.id);
  const base = `/u/${event.params.id}`;
  const label = profile?.name ?? "Not found";
  if (profile?.kind === "system")
    return {
      nav: {
        back: { href: "/developers/apps", label: "Apps" },
        crumbs: [
          { href: "/", label: "Home" },
          { href: "/developers", label: "Developers" },
          { href: "/developers/apps", label: "Apps" },
          { href: base, label },
        ],
        sections: {
          top: [
            { items: [{ href: base, label, icon: AppWindow }] },
            ...(profile.manage
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
    };
  return {
    nav: {
      root: base,
      fallback: "/todos",
      back: { label: "Back" },
      crumbs: [
        { href: "/", label: "Home" },
        { href: base, label },
      ],
      sections: { top: [{ items: [{ href: base, label, icon: UserRound }] }] },
    },
  };
};
