// "Back" points to wherever the user entered the section from: the first navigation
// whose origin lies outside `root`. A direct load falls back home, never a dead button.
import { afterNavigate } from "$app/navigation";
import { under } from "./nav";

export function origin(root: () => string | undefined) {
  let from = $state<string>();
  afterNavigate((nav) => {
    const prefix = root();
    const url = nav.from?.url;
    if (!prefix || !url) return;
    if (!under(url.pathname, prefix)) from = url.pathname + url.search;
  });
  return {
    get href() {
      return from ?? "/home";
    },
  };
}
