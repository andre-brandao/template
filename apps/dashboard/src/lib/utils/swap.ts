import { tick } from "svelte";

/**
 * Run a state change inside a view transition scoped to one component: the page holds still
 * and whatever names itself under `html[data-swap~='<key>']` animates. The state-driven twin
 * of the same-path branch in `ViewTransitions` — a filter that never touches the URL.
 */
export function swap(key: string, run: () => void) {
  if (!document.startViewTransition) return run();
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return run();

  const root = document.documentElement;
  root.dataset.scope = "filter";
  root.dataset.swap = key;
  document
    .startViewTransition(async () => {
      run();
      // Svelte flushes asynchronously; without this the snapshot predates the update.
      await tick();
    })
    .finished.finally(() => {
      delete root.dataset.scope;
      delete root.dataset.swap;
    });
}
