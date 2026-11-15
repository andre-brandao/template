import type { Prefs } from "@template/core/user/prefs";

/**
 * Repaints at once, ahead of the save: the one preference allowed to lead. With `from` the
 * new theme wipes out from that element (CSS in `layout.css`); without it, or without motion, it swaps.
 */
export function swap(theme: Prefs["theme"], from?: HTMLElement) {
  const root = document.documentElement;
  const set = () => (root.dataset.theme = theme);
  if (!from || !document.startViewTransition) return set();
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return set();

  // The circle grows from the element out to the furthest corner of the viewport.
  const box = from.getBoundingClientRect();
  const x = box.left + box.width / 2;
  const y = box.top + box.height / 2;
  root.style.setProperty("--x", `${x}px`);
  root.style.setProperty("--y", `${y}px`);
  root.style.setProperty(
    "--r",
    `${Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))}px`,
  );
  // Before the snapshot, so the outgoing frame is captured as one whole-page group.
  root.dataset.scope = "theme";
  document.startViewTransition(set).finished.finally(() => delete root.dataset.scope);
}
