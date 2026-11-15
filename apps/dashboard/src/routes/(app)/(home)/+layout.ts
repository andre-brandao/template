import { home } from "$lib/components/layout/nav";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = () => ({ nav: { sections: { top: home } } });
