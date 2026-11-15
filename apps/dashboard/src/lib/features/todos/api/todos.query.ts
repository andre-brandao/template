import { createMutation, keepPreviousData, type QueryClient } from "@tanstack/svelte-query";
import {
  deleteTodoByIdLinkMutation,
  deleteTodoByIdMutation,
  getTodoByIdOptions,
  getTodoByIdQueryKey,
  getTodoInsightsActivityOptions,
  getTodoInsightsActivityQueryKey,
  getTodoInsightsCalendarOptions,
  getTodoInsightsCalendarQueryKey,
  getTodoInsightsDueOptions,
  getTodoInsightsDueQueryKey,
  getTodoInsightsLoadOptions,
  getTodoInsightsLoadQueryKey,
  getTodoInsightsStatsOptions,
  getTodoInsightsStatsQueryKey,
  getTodoInsightsStatusOptions,
  getTodoInsightsStatusQueryKey,
  getTodoOptions,
  getTodoQueryKey,
  getTodoStageOptions,
  getTodoStageQueryKey,
  getUserOptions,
  patchTodoByIdMutation,
  postTodoByIdLinkMutation,
  postTodoByIdMoveMutation,
  postTodoMutation,
  type GetTodoData,
  type Todo,
} from "@template/sdk/query";

type Scope = { source?: string; sourceID?: string };
type Range = Scope & { start: string; end: string };

// Rows, lists, stages and insights all carry the tag; project pages count todos, so they refresh too.
const todo = [[{ tags: ["Todo"] }], [{ tags: ["Project"] }]];

// Everything but rows: a removed todo's own query would refetch straight into a 404.
const views = () => [
  getTodoQueryKey(),
  getTodoStageQueryKey(),
  getTodoInsightsStatsQueryKey(),
  getTodoInsightsStatusQueryKey(),
  getTodoInsightsLoadQueryKey(),
  getTodoInsightsDueQueryKey(),
  getTodoInsightsCalendarQueryKey(),
  getTodoInsightsActivityQueryKey(),
  [{ tags: ["Project"] }],
];

// Every board view groups this one page client-side; the last page stays up while the next loads.
export const list = (q: Omit<NonNullable<GetTodoData["query"]>, "pageSize">) => ({
  ...getTodoOptions({ query: { ...q, pageSize: 100 } }),
  placeholderData: keepPreviousData,
});

export const get = (id: string) => getTodoByIdOptions({ path: { id } });

export const stages = (scope: Scope) => getTodoStageOptions({ query: scope });

export const users = () => getUserOptions();

// Insights keep the last range on screen while the next one loads.
export const stats = (range: Range) => ({
  ...getTodoInsightsStatsOptions({ query: range }),
  placeholderData: keepPreviousData,
});

export const statuses = (range: Range) => ({
  ...getTodoInsightsStatusOptions({ query: range }),
  placeholderData: keepPreviousData,
});

export const load = (range: Range) => ({
  ...getTodoInsightsLoadOptions({ query: range }),
  placeholderData: keepPreviousData,
});

export const due = (scope: Scope) => ({
  ...getTodoInsightsDueOptions({ query: scope }),
  placeholderData: keepPreviousData,
});

export const calendar = (range: Range) => ({
  ...getTodoInsightsCalendarOptions({ query: range }),
  placeholderData: keepPreviousData,
});

export const activity = (range: Range) => ({
  ...getTodoInsightsActivityOptions({ query: range }),
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
