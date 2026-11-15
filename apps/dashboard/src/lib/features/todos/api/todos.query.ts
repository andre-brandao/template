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

type Scope = { source?: string; sourceID?: string };
type Range = Scope & { start: string; end: string };

// Rows, lists and stages carry the Todo tag; insights and project pages count todos, so they refresh too.
const todo = [[{ tags: ["Todo"] }], [{ tags: ["Insights"] }], [{ tags: ["Project"] }]];

// Everything but rows: a removed todo's own query would refetch straight into a 404.
const views = () => [
  getTodoQueryKey(),
  getTodoStageQueryKey(),
  [{ tags: ["Insights"] }],
  [{ tags: ["Project"] }],
];

// Every board view groups this one page client-side; the last page stays up while the next loads.
export const list = (q: Omit<NonNullable<GetTodoData["query"]>, "pageSize">) => ({
  ...getTodoOptions({ query: { ...q, pageSize: 100 } }),
  placeholderData: keepPreviousData,
});

type Filters = Omit<NonNullable<GetTodoData["query"]>, "pageSize" | "from" | "to" | "unscheduled">;

// The calendar's visible window; `from`/`to` are inclusive instants.
export const between = (q: Filters & { from: string; to: string }) => list(q);

// The calendar tray: todos with neither a start nor a due date.
export const undated = (q: Filters) => list({ ...q, unscheduled: true });

export const get = (id: string) => getTodoByIdOptions({ path: { id } });

export const stages = (scope: Scope) => getTodoStageOptions({ query: scope });

export const users = () => getUserOptions();

// Insights keep the last range on screen while the next one loads.
export const stats = (range: Range) => ({
  ...getInsightsStatsOptions({ query: range }),
  placeholderData: keepPreviousData,
});

export const statuses = (range: Range) => ({
  ...getInsightsStatusOptions({ query: range }),
  placeholderData: keepPreviousData,
});

export const load = (range: Range) => ({
  ...getInsightsLoadOptions({ query: range }),
  placeholderData: keepPreviousData,
});

export const due = (scope: Scope) => ({
  ...getInsightsDueOptions({ query: scope }),
  placeholderData: keepPreviousData,
});

export const calendar = (range: Range) => ({
  ...getInsightsCalendarOptions({ query: range }),
  placeholderData: keepPreviousData,
});

export const activity = (range: Range) => ({
  ...getInsightsActivityOptions({ query: range }),
  placeholderData: keepPreviousData,
});

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
