import { Template } from "@template/core/email/template";
import type { LayoutServerLoad } from "./$types";

// The section's own `+layout.server` already 404s outside dev, and this runs below it.
// Only the plain fields cross the wire — `render` is a function.
export const load: LayoutServerLoad = () => ({
  mails: Template._list.map((one) => ({ name: one.name, label: one.label, blurb: one.blurb })),
});
