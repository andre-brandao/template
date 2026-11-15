import { home } from "#lib/components/layout/nav.ts";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = () => ({ nav: { sections: { top: home } } });
