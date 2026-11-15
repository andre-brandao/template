import type { Component } from "svelte";
import type { Props } from "./modules";
import Current from "./components/layouts/Current.svelte";
import Strip from "./components/layouts/Strip.svelte";

/** Home layouts: the same `Props`, arranged differently. The first is the default. */
export const layouts = {
  current: { label: "Current", component: Current },
  strip: { label: "Strip", component: Strip },
} satisfies Record<string, { label: string; component: Component<Props> }>;
