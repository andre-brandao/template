import type { Todo } from "@template/core/todo";
import { snap, type Spot } from "./layout";

export type Kind = "move" | "resize";

type Active = { todo: Todo.Info; kind: Kind; origin?: Spot };

const inside = (rect: DOMRect, x: number, y: number) =>
  x >= rect.left && x < rect.right && y >= rect.top && y < rect.bottom;

/** The day (and minute, over `data-hours`) under a point; chips on top are skipped. */
function locate(x: number, y: number): Spot | undefined {
  const el = document
    .elementsFromPoint(x, y)
    .find(
      (one): one is HTMLElement =>
        one instanceof HTMLElement &&
        !!one.dataset.day &&
        inside(one.getBoundingClientRect(), x, y),
    );
  if (!el?.dataset.day) return;
  if (el.dataset.hours === undefined) return { day: el.dataset.day };
  const rect = el.getBoundingClientRect();
  return { day: el.dataset.day, minute: snap(((y - rect.top) / rect.height) * 1440) };
}

// Eats the click a drop would fire on whatever sits under the pointer.
function swallow() {
  const eat = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  addEventListener("click", eat, { capture: true, once: true });
  setTimeout(() => removeEventListener("click", eat, { capture: true }));
}

/** Pointer drag for chips: a press that travels a few pixels becomes a drag, else a click. */
export function createDrag(
  drop: (todo: Todo.Info, kind: Kind, origin: Spot | undefined, to: Spot) => void,
) {
  const state = $state<{ active?: Active; over?: Spot; x: number; y: number }>({ x: 0, y: 0 });

  function grab(e: PointerEvent, todo: Todo.Info, kind: Kind = "move") {
    if (e.button !== 0) return;
    e.stopPropagation();
    const x = e.clientX;
    const y = e.clientY;
    const origin = locate(x, y);
    const move = (ev: PointerEvent) => {
      if (!state.active && Math.hypot(ev.clientX - x, ev.clientY - y) < 5) return;
      ev.preventDefault();
      state.active = { todo, kind, origin };
      state.over = locate(ev.clientX, ev.clientY);
      state.x = ev.clientX;
      state.y = ev.clientY;
    };
    const end = (ev: PointerEvent) => {
      removeEventListener("pointermove", move);
      removeEventListener("pointerup", end);
      removeEventListener("pointercancel", end);
      const active = state.active;
      const over = state.over;
      state.active = undefined;
      state.over = undefined;
      if (!active) return;
      swallow();
      if (ev.type === "pointerup" && over) drop(active.todo, active.kind, active.origin, over);
    };
    addEventListener("pointermove", move);
    addEventListener("pointerup", end);
    addEventListener("pointercancel", end);
  }

  return {
    grab,
    get active() {
      return state.active;
    },
    get over() {
      return state.over;
    },
    get x() {
      return state.x;
    },
    get y() {
      return state.y;
    },
  };
}
