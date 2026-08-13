import { createContext } from "svelte";

/**
 * The rail's collapsed state, plus the transient hover and focus that peek it open again.
 *
 * Created once in the root layout rather than in the Shell: each route group mounts its own
 * Shell, so state held in the component was rebuilt — and re-animated — every time a
 * navigation crossed a group boundary. Context rather than a module-level `$state` for the
 * usual reason: the server renders every request in one process, and a module would hand
 * one visitor's rail to the next.
 *
 * Seeded from a cookie, which is the whole point of the round trip — `localStorage` can only
 * be read after hydration, so a collapsed rail painted wide and then snapped shut.
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
    /**
     * The peek wiring, spread onto both halves of the hover target — the topbar's rail
     * cell and the sidebar are one column, so they must open and shut as one.
     */
    attrs: {
      // A short intent delay so brushing past the rail on the way somewhere else doesn't open it.
      onpointerenter: () => {
        timer = setTimeout(() => (hover = true), 90);
      },
      /**
       * The column is the topbar's left cell stacked on the sidebar, two elements that both
       * start at the viewport's left edge and share a width — so "still in the column" is one
       * horizontal test, and crossing from the menu up to the project picker doesn't read as
       * leaving. It also rejects a phantom leave: a view transition hides the live DOM behind
       * its snapshots, so mid-navigation the browser hit-tests the pointer onto <html> and
       * reports it leaving a rail it never left.
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
       * Kept apart from `hover` on purpose: clicking a link destroys it, which fires focusout
       * with nothing to hand focus to. Folded together that would shut a rail the pointer is
       * still resting on, and the next frame would open it again.
       */
      onfocusout: (e: FocusEvent & { currentTarget: HTMLElement }) => {
        focused = e.currentTarget.contains(e.relatedTarget as Node);
      },
    },
  };
}
