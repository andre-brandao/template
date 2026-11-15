import type { Todo } from "@template/core/todo";

/** Multi-valued filters; "none" stands for unassigned or unstaged, as the API spells it. */
export type Picks = { status: Todo.Status[]; assignee: string[]; stage: string[] };

const one = <T>(list: T[]) => (list.length === 1 ? list[0] : undefined);

/** The API takes one value per filter, so a single pick narrows there and more narrow here. */
export const server = (picks: Picks) => ({
  status: one(picks.status),
  assignee: one(picks.assignee),
  stage: one(picks.stage),
});

const hit = (list: string[], value: string) => list.length < 2 || list.includes(value);

export const keep = (picks: Picks) => (todo: Todo.Info) =>
  hit(picks.status, todo.status) &&
  hit(picks.assignee, todo.assignee?.id ?? "none") &&
  hit(picks.stage, todo.stage || "none");
