import { z } from "zod";
import type { Todo } from "@template/core/todo";
import { last, valid } from "@template/ui/day";
import { sort } from "./sort";
import { STATUSES } from "./status";

/** Multi-valued filters; "none" stands for unassigned or unstaged, as the API spells it. */
export type Picks = { status: Todo.Status[]; assignee: string[]; stage: string[] };

type Scope = { source?: string; sourceID?: string };

const one = <T>(list: T[]) => (list.length === 1 ? list[0] : undefined);

/** The API takes one value per filter, so a single pick narrows there and more narrow here. */
const server = (picks: Picks) => ({
  status: one(picks.status),
  assignee: one(picks.assignee),
  stage: one(picks.stage),
});

const hit = (list: string[], value: string) => list.length < 2 || list.includes(value);

export const keep = (picks: Picks) => (todo: Todo.Info) =>
  hit(picks.status, todo.status) &&
  hit(picks.assignee, todo.assignee?.id ?? "none") &&
  hit(picks.stage, todo.stage || "none");

/** The todos page's URL state; its load parses the same, so both ask for one key. */
export const schema = z.object({
  q: z.string().default(""),
  // Repeated params: `?status=active&status=blocked`.
  status: z.array(z.enum(STATUSES)).default([]),
  assignee: z.array(z.string()).default([]),
  stage: z.array(z.string()).default([]),
  view: z.enum(["list", "board", "table", "timeline", "calendar"]).default("table"),
  group: z.enum(["status", "stage", "assignee"]).default("status"),
  mode: z.enum(["month", "week"]).default("month"),
  at: z.iso.date().optional(),
  sort: sort.schema,
});

/** The list query's args: the server-side narrowing of the URL's picks, search and sort. */
export const where = (params: z.infer<typeof schema>, scope: Scope) => ({
  ...scope,
  ...server(params),
  search: params.q || undefined,
  sort: params.sort,
});

/** Insights' range in the URL, 30 days to `now` by default. */
export const period = (now: string) => {
  const fallback = last(30, now);
  return z.object({
    start: z.iso.date().default(fallback.start),
    end: z.iso.date().default(fallback.end),
  });
};

/** valid() rejects out-of-order or over-long ranges, so garbage params collapse to the fallback. */
export const span = (params: { start: string; end: string }, now: string) =>
  valid(params) ? { start: params.start, end: params.end } : last(30, now);
