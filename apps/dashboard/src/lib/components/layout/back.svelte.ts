// "Back" points to wherever the user entered the section from: the first navigation
// whose origin lies outside `prefix`. No origin (direct load) falls back — never a dead button.
import { afterNavigate } from "$app/navigation";

export function origin(prefix: string, fallback: string) {
  let from = $state<string>();
  afterNavigate((nav) => {
    const url = nav.from?.url;
    if (url && !url.pathname.startsWith(prefix)) from = url.pathname + url.search;
  });
  return {
    get href() {
      return from ?? fallback;
    },
  };
}
