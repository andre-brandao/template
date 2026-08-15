import type { Component, Snippet } from "svelte";

// Overrides for the nodes an app needs to own. Everything else renders natively.
export type Components = {
  a?: Component<{ href: string; title?: string; children: Snippet }>;
  code?: Component<{ value: string; lang?: string; title?: string }>;
  img?: Component<{ src: string; alt: string; title?: string }>;
  // Only reached when the parser was told to keep html; the override owns the escaping.
  html?: Component<{ value: string }>;
};
