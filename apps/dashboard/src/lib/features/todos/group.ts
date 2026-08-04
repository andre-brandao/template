import type { Todo } from "@template/core/todo";
import { STATUSES, color, label } from "./status";

export type By = "status" | "stage" | "assignee";

export type Group = { key: string; label: string; color?: string; items: Todo.Info[] };

/** Earliest planned start in a bucket, so stages and people line up chronologically. */
function first(items: Todo.Info[]) {
  const dates = items.map((todo) => todo.startDate).filter((date) => date !== null);
  return dates.length ? Math.min(...dates.map(Date.parse)) : Infinity;
}

function bucket(todos: Todo.Info[], by: By) {
  const out = new Map<string, { label: string; items: Todo.Info[] }>();
  for (const todo of todos) {
    const at = by === "stage" ? todo.stage : todo.assignee?.id;
    const name = by === "stage" ? todo.stage : todo.assignee?.name;
    const key = at ?? "none";
    const seen = out.get(key);
    if (seen) seen.items.push(todo);
    else
      out.set(key, { label: name ?? (by === "stage" ? "No stage" : "Unassigned"), items: [todo] });
  }
  return out;
}

/**
 * Client-side grouping for the board and the timeline — one `getTodos` feeds every view,
 * so switching how work is sliced never costs a round trip.
 */
export function group(todos: Todo.Info[], by: By): Group[] {
  if (by === "status")
    return STATUSES.map((status) => ({
      key: status,
      label: label(status),
      color: color(status),
      items: todos.filter((todo) => todo.status === status),
    }));

  const buckets = bucket(todos, by);
  const named = [...buckets]
    .filter(([key]) => key !== "none")
    .map(([key, group]) => ({ key, ...group }))
    .sort((a, b) => first(a.items) - first(b.items) || a.label.localeCompare(b.label));

  const loose = buckets.get("none");
  // Whatever hasn't been placed yet sits at the end, where it reads as a to-sort pile.
  return loose ? [...named, { key: "none", ...loose }] : named;
}
