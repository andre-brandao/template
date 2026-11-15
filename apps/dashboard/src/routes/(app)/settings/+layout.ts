import Sparkles from "@lucide/svelte/icons/sparkles";
import UserRound from "@lucide/svelte/icons/user-round";
import { section } from "$lib/components/layout/nav";

export const load = () => ({
  nav: section("/settings", "Settings", [
    {
      title: "User",
      items: [
        { href: "/settings/account", label: "Account", icon: UserRound },
        { href: "/settings/experience", label: "Experience", icon: Sparkles },
      ],
    },
  ]),
});
