import type { Todo } from "@template/core/todo";

/** Pipeline order — the board's column order, and the picker's menu order. */
export const STATUSES = ["backlog", "planned", "active", "blocked", "done"] as const;

const meta: Record<Todo.Status, { label: string; color: string }> = {
  backlog: { label: "Backlog", color: "var(--dim)" },
  planned: { label: "Planned", color: "var(--pending)" },
  active: { label: "Active", color: "var(--progress)" },
  blocked: { label: "Blocked", color: "var(--danger)" },
  done: { label: "Done", color: "var(--done)" },
};

export const label = (status: Todo.Status) => meta[status].label;

export const color = (status: Todo.Status) => meta[status].color;

/** Past its due date with work still outstanding — the one thing worth shouting about. */
export const late = (todo: Todo.Info) =>
  todo.status !== "done" && !!todo.dueDate && Date.parse(todo.dueDate) < Date.now();

/** Reasons offered when closing, mirroring how issues get closed elsewhere. */
export const REASONS = [
  { value: "completed", label: "completed" },
  { value: "not_planned", label: "not planned" },
];
