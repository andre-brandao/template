import type { Todo } from "@template/core/todo";

export function label(state: Todo.State) {
  return state === "open" ? "Open" : "Closed";
}

export function color(state: Todo.State) {
  return state === "open" ? "var(--pending)" : "var(--done)";
}
