import AppWindow from "@lucide/svelte/icons/app-window";
import UserRound from "@lucide/svelte/icons/user-round";
import Webhook from "@lucide/svelte/icons/webhook";
import { Permission } from "@template/core/permission";
import { getUserByIdOptions } from "@template/sdk/query";
import { section } from "#lib/components/layout/nav.ts";
import type { LayoutLoad } from "./$types";

// An App sits under Developers → Apps; a person has no section, so back goes where they came from.
export const load: LayoutLoad = async (event) => {
  const data = await event.parent();
  // Same origin as the browser client, so this lands under the key the page reads. A 404 is the page's to show.
  const profile = await data.queryClient
    .fetchQuery(
      getUserByIdOptions({
        path: { id: event.params.id },
        baseUrl: `${event.url.origin}/api`,
        fetch: event.fetch,
      }),
    )
    .catch(() => undefined);
  const base = `/u/${event.params.id}`;
  const label = profile?.name ?? "Not found";
  if (profile?.kind === "system")
    return {
      nav: {
        back: { href: "/developers/apps", label: "Apps" },
        crumbs: [
          { href: "/home", label: "Home" },
          { href: "/developers", label: "Developers" },
          { href: "/developers/apps", label: "Apps" },
          { href: base, label },
        ],
        sections: {
          top: [
            { items: [{ href: base, label, icon: AppWindow }] },
            ...(Permission.can(data.user?.role, { app: ["update"] })
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
  return { nav: section(base, label, [{ items: [{ href: base, label, icon: UserRound }] }]) };
};
