import KeyRound from "@lucide/svelte/icons/key-round";
import Sparkles from "@lucide/svelte/icons/sparkles";
import UserRound from "@lucide/svelte/icons/user-round";
import type { LayoutLoad } from "./$types";

// `data` is the server load's output: a sibling +layout.ts shadows it, so it only
// reaches `page.data` through this spread.
export const load: LayoutLoad = ({ data }) => ({
  ...data,
  nav: {
    root: "/settings",
    fallback: "/todos",
    back: { label: "Back" },
    crumbs: [
      { href: "/", label: "Home" },
      { href: "/settings", label: "Settings" },
    ],
    sections: {
      top: [
        {
          title: "User",
          items: [
            { href: "/settings/profile", label: "Profile", icon: UserRound },
            { href: "/settings/experience", label: "Experience", icon: Sparkles },
          ],
        },
        {
          title: "Workspace",
          items: [{ href: "/settings/keys", label: "API keys", icon: KeyRound }],
        },
      ],
    },
  },
});
