import type { Todo } from "@template/core/todo";
import { toDay, today } from "@template/ui";

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

/** Past its due day in the zone with work outstanding; due today isn't late until the day ends. */
export const late = (todo: Todo.Info, zone: string) =>
  todo.status !== "done" && !!todo.dueDate && toDay(todo.dueDate, zone) < today(zone);
