import { createContext } from "svelte";

/**
 * The rail's collapsed state, plus the transient hover/focus that peek it open. Lives in
 * root-layout context: per-request (no SSR leak) and survives route-group Shell remounts.
 * Seeded from a cookie so the first paint is already at the right width.
 */
const [sidebar, set] = createContext<ReturnType<typeof create>>();

export { sidebar };

/** Call once, in the root layout. */
export function createRail(init: boolean) {
  set(create(init));
}

function create(init: boolean) {
  let tight = $state(init);
  let hover = $state(false);
  let focused = $state(false);
  let timer: ReturnType<typeof setTimeout>;

  return {
    get tight() {
      return tight;
    },
    /** Pointed at while collapsed. Still collapsed — just not drawn that way for the moment. */
    get peek() {
      return tight && (hover || focused);
    },
    get shut() {
      return tight && !hover && !focused;
    },
    toggle() {
      clearTimeout(timer);
      hover = false;
      focused = false;
      tight = !tight;
      // Read back in `+layout.server.ts`, so the next full load paints at the right width.
      document.cookie = `rail=${tight ? "tight" : "wide"};path=/;max-age=31536000;samesite=lax`;
    },
    /** Peek wiring, spread onto the sidebar — the whole column, brand strip included. */
    attrs: {
      // A short intent delay so brushing past the rail on the way somewhere else doesn't open it.
      onpointerenter: () => {
        timer = setTimeout(() => (hover = true), 90);
      },
      /**
       * "Still in the column" is one horizontal test against the panel's own right edge.
       * Also rejects the phantom leave a view transition fires mid-navigation.
       */
      onpointerleave: (e: PointerEvent & { currentTarget: HTMLElement }) => {
        const edge = e.currentTarget.getBoundingClientRect().right;
        if (e.clientX < edge && e.clientY >= 0 && e.clientY < innerHeight) return;
        clearTimeout(timer);
        hover = false;
      },
      onfocusin: () => {
        focused = true;
      },
      /**
       * Kept apart from `hover`: clicking a link fires focusout with no new target, and
       * folding them together would shut a rail the pointer still rests on.
       */
      onfocusout: (e: FocusEvent & { currentTarget: HTMLElement }) => {
        focused = e.currentTarget.contains(e.relatedTarget as Node);
      },
    },
  };
}
