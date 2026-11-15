import { createMutation, keepPreviousData, type QueryClient } from "@tanstack/svelte-query";
import {
  deleteTodoByIdLinkMutation,
  deleteTodoByIdMutation,
  getTodoByIdOptions,
  getTodoByIdQueryKey,
  getInsightsActivityOptions,
  getInsightsCalendarOptions,
  getInsightsDueOptions,
  getInsightsLoadOptions,
  getInsightsStatsOptions,
  getInsightsStatusOptions,
  getTodoOptions,
  getTodoQueryKey,
  getTodoStageOptions,
  getTodoStageQueryKey,
  getUserOptions,
  patchTodoByIdMutation,
  patchTodoStageMutation,
  postTodoByIdLinkMutation,
  postTodoByIdMoveMutation,
  postTodoMutation,
  type GetTodoData,
  type Todo,
} from "@template/sdk/query";
import { zone, type Prefs } from "@template/core/user/prefs";
import { today } from "@template/ui/day";
import { call, type Ctx } from "$lib/query";
import { parse } from "$lib/utils/params";
import { period, schema, span, where } from "../filter";
import { getLabels } from "./todos.remote";

type Scope = { source?: string; sourceID?: string };
type Range = Scope & { start: string; end: string };

// Rows, lists and stages carry the Todo tag; insights and project pages count todos, so they refresh too.
// Picker options sit under the plain `todos` root.
const todo = [[{ tags: ["Todo"] }], [{ tags: ["Insights"] }], [{ tags: ["Project"] }], ["todos"]];

// Everything but rows: a removed todo's own query would refetch straight into a 404.
const views = () => [
  getTodoQueryKey(),
  getTodoStageQueryKey(),
  [{ tags: ["Insights"] }],
  [{ tags: ["Project"] }],
  ["todos"],
];

// Every board view groups this one page client-side; the last page stays up while the next loads.
export const list = (q: Omit<NonNullable<GetTodoData["query"]>, "pageSize">, ctx?: Ctx) => ({
  ...getTodoOptions({ ...ctx, query: { ...q, pageSize: 100 } }),
  placeholderData: keepPreviousData,
});

type Filters = Omit<NonNullable<GetTodoData["query"]>, "pageSize" | "from" | "to" | "unscheduled">;

// The calendar's visible window; `from`/`to` are inclusive instants.
export const between = (q: Filters & { from: string; to: string }) => list(q);

// The calendar tray: todos with neither a start nor a due date.
export const undated = (q: Filters) => list({ ...q, unscheduled: true });

export const get = (id: string, ctx?: Ctx) => getTodoByIdOptions({ ...ctx, path: { id } });

export const stages = (scope: Scope, ctx?: Ctx) => getTodoStageOptions({ ...ctx, query: scope });

export const users = () => getUserOptions();

// The stage picker's labels, each with the projects its todos sit in, grouped in SQL.
export const labels = (scope: Scope) => ({
  queryKey: ["todos", "labels", scope],
  queryFn: call(() => getLabels(scope)),
});

// Insights keep the last range on screen while the next one loads.
export const stats = (range: Range, ctx?: Ctx) => ({
  ...getInsightsStatsOptions({ ...ctx, query: range }),
  placeholderData: keepPreviousData,
});

export const statuses = (range: Range, ctx?: Ctx) => ({
  ...getInsightsStatusOptions({ ...ctx, query: range }),
  placeholderData: keepPreviousData,
});

export const load = (range: Range, ctx?: Ctx) => ({
  ...getInsightsLoadOptions({ ...ctx, query: range }),
  placeholderData: keepPreviousData,
});

export const due = (scope: Scope, ctx?: Ctx) => ({
  ...getInsightsDueOptions({ ...ctx, query: scope }),
  placeholderData: keepPreviousData,
});

export const calendar = (range: Range, ctx?: Ctx) => ({
  ...getInsightsCalendarOptions({ ...ctx, query: range }),
  placeholderData: keepPreviousData,
});

export const activity = (range: Range, ctx?: Ctx) => ({
  ...getInsightsActivityOptions({ ...ctx, query: range }),
  placeholderData: keepPreviousData,
});

// What a page asks for first, for its load to warm: built from the same URL, so the keys match.

/** The todos page's one list; the calendar asks for its own window, so it waits for that. */
export const board = (url: URL, scope: Scope, ctx?: Ctx) => {
  const params = parse(schema, url);
  return params.view === "calendar" ? [] : [list(where(params, scope), ctx)];
};

/** Every insights section, for the range in `url`, defaulting to the month to today in the reader's zone. */
export const insights = (url: URL, prefs: Prefs, scope: Scope, ctx?: Ctx) => {
  const now = today(zone(prefs));
  const range = { ...span(parse(period(now), url), now), ...scope };
  return [
    stats(range, ctx),
    activity(range, ctx),
    statuses(range, ctx),
    calendar(range, ctx),
    due(scope, ctx),
    load(range, ctx),
  ];
};

/** A todo and its sub-issues. */
export const detail = (id: string, ctx?: Ctx) => [
  get(id, ctx),
  list({ parentID: id, sort: ["position"] }, ctx),
];

export const create = (opts?: Pick<ReturnType<typeof postTodoMutation>, "onSuccess">) =>
  createMutation(() => ({
    ...postTodoMutation(),
    meta: { invalidates: todo },
    ...opts,
  }));

export const update = (opts?: Pick<ReturnType<typeof patchTodoByIdMutation>, "onSuccess">) =>
  createMutation(() => ({
    ...patchTodoByIdMutation(),
    meta: { invalidates: todo },
    ...opts,
  }));

// Relabels every todo in a stage at once.
export const rename = (opts?: Pick<ReturnType<typeof patchTodoStageMutation>, "onSuccess">) =>
  createMutation(() => ({
    ...patchTodoStageMutation(),
    meta: { invalidates: todo },
    ...opts,
  }));

export const move = (opts?: Pick<ReturnType<typeof postTodoByIdMoveMutation>, "onSuccess">) =>
  createMutation(() => ({
    ...postTodoByIdMoveMutation(),
    meta: { invalidates: [getTodoQueryKey()] },
    ...opts,
  }));

export const remove = (opts?: Pick<ReturnType<typeof deleteTodoByIdMutation>, "onSuccess">) =>
  createMutation(() => ({
    ...deleteTodoByIdMutation(),
    meta: { invalidates: views() },
    ...opts,
  }));

// Links only show on the todo itself, so the returned row replaces its entry and nothing refetches.
export const link = (opts?: Pick<ReturnType<typeof postTodoByIdLinkMutation>, "onSuccess">) =>
  createMutation(() => ({
    ...postTodoByIdLinkMutation(),
    meta: { invalidates: [] },
    onSuccess: (data, vars, result, ctx) => {
      row(ctx.client, data);
      return opts?.onSuccess?.(data, vars, result, ctx);
    },
  }));

export const unlink = (opts?: Pick<ReturnType<typeof deleteTodoByIdLinkMutation>, "onSuccess">) =>
  createMutation(() => ({
    ...deleteTodoByIdLinkMutation(),
    meta: { invalidates: [] },
    onSuccess: (data, vars, result, ctx) => {
      row(ctx.client, data);
      return opts?.onSuccess?.(data, vars, result, ctx);
    },
  }));

function row(client: QueryClient, data: Todo) {
  client.setQueryData(getTodoByIdQueryKey({ path: { id: data.id } }), data);
}
