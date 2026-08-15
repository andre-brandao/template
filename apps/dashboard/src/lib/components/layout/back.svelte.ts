// "Back" points to wherever the user entered the section from: the first navigation
// whose origin lies outside `root`. No origin (direct load) falls back — never a dead button.
// Getters, not values: one instance lives in the permanent Shell and the section moves under it.
import { afterNavigate } from "$app/navigation";

export function origin(root: () => string | undefined, fallback: () => string | undefined) {
  let from = $state<string>();
  afterNavigate((nav) => {
    const prefix = root();
    const url = nav.from?.url;
    if (!prefix || !url) return;
    if (!url.pathname.startsWith(prefix)) from = url.pathname + url.search;
  });
  return {
    get href() {
      return from ?? fallback() ?? "/";
    },
  };
}
