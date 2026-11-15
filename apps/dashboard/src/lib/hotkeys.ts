import { defineAppHotkeys } from "@tanstack/svelte-hotkeys";

/** Every app key, declared once so the `?` sheet lists it before its page mounts. */
export const hotkeys = defineAppHotkeys({
  // Always, so the browser's own ⌘K never wins while a modal's scope pauses this one.
  palette: {
    hotkey: "Mod+K",
    meta: { name: "Command palette", group: "General" },
    options: { preventDefault: "always" },
  },
  help: { hotkey: "?", meta: { name: "Keyboard shortcuts", group: "General" } },
  create: { hotkey: "C", meta: { name: "New item on this page", group: "Page" } },
  search: { hotkey: "/", meta: { name: "Search this page", group: "Page" } },
  today: { hotkey: "T", meta: { name: "Go to today", group: "Calendar" } },
  back: { hotkey: "[", meta: { name: "Previous period", group: "Calendar" } },
  next: { hotkey: "]", meta: { name: "Next period", group: "Calendar" } },
  month: { hotkey: "M", meta: { name: "Month view", group: "Calendar" } },
  week: { hotkey: "W", meta: { name: "Week view", group: "Calendar" } },
});

declare module "@tanstack/svelte-hotkeys" {
  interface Register {
    appHotkeys: typeof hotkeys;
  }
}
