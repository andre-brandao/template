import Braces from "@lucide/svelte/icons/braces";
import Component from "@lucide/svelte/icons/component";
import FileCode from "@lucide/svelte/icons/file-code";
import FlaskConical from "@lucide/svelte/icons/flask-conical";
import Mail from "@lucide/svelte/icons/mail";
import { section } from "#lib/components/layout/nav.ts";

export const load = () => ({
  nav: section("/dev", "Dev", [
    {
      title: "Tools",
      items: [
        { href: "/dev", label: "Overview", icon: FlaskConical, exact: true },
        { href: "/dev/story", label: "Storybook", icon: Component },
        { href: "/dev/api", label: "API explorer", icon: Braces },
        { href: "/dev/prototype", label: "Prototypes", icon: FileCode },
        { href: "/dev/mail", label: "Mail", icon: Mail },
      ],
    },
  ]),
});
