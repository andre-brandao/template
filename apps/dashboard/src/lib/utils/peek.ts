import { pushState } from "$app/navigation";

/**
 * Shallow-routes a detail link: `state` lands in `page.state` while the page stays
 * mounted (a Drawer keys on it). Small screens, modified clicks and no-JS fall through.
 */
export function peek(state: App.PageState) {
  return (e: MouseEvent & { currentTarget: HTMLAnchorElement }) => {
    if (innerWidth < 640 || e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return;
    e.preventDefault();
    pushState(e.currentTarget.href, state);
  };
}
