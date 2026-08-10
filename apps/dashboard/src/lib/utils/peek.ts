import { pushState } from "$app/navigation";

/**
 * Shallow-routes a detail link: the URL updates and `state` lands in `page.state`,
 * but the page underneath stays mounted — the page hosting the link renders a
 * Drawer keyed on that state. Small screens, modified clicks, and no-JS fall
 * through to real navigation.
 */
export function peek(state: App.PageState) {
  return (e: MouseEvent & { currentTarget: HTMLAnchorElement }) => {
    if (innerWidth < 640 || e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return;
    e.preventDefault();
    pushState(e.currentTarget.href, state);
  };
}
