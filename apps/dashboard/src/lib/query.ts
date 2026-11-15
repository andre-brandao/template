import { browser } from "$app/env";
import {
  MutationCache,
  QueryClient,
  matchQuery,
  type EnsureQueryDataOptions,
  type MutationOptions,
  type QueryFunctionContext,
  type QueryKey,
} from "@tanstack/svelte-query";
import { client } from "@template/sdk/client.gen";

declare module "@tanstack/svelte-query" {
  interface Register {
    mutationMeta: { invalidates?: QueryKey[] };
  }
}

// baseUrl is part of every query key, and the client builds `new Request(url)`, so absolute.
if (browser) client.setConfig({ baseUrl: `${location.origin}/api` });

const create = () =>
  new QueryClient({
    defaultOptions: { queries: { enabled: browser, staleTime: 30_000 } },
    mutationCache: new MutationCache({
      // No meta invalidates everything. Returning the promise keeps `isPending` until the refetch lands.
      onSuccess: (_data, _vars, _result, mutation, ctx) =>
        ctx.client.invalidateQueries({
          predicate: (query) =>
            mutation.meta?.invalidates?.some((key) => matchQuery({ queryKey: key }, query)) ?? true,
        }),
    }),
  });

// One per tab in the browser; one per request on the server, so users never share a cache.
const shared = browser ? create() : undefined;

/** On the server this also points the SDK at `origin`, so SSR reads the keys a load warmed. */
export const queryClient = (origin: string) => {
  if (!browser) client.setConfig({ baseUrl: `${origin}/api` });
  return shared ?? create();
};

/** For a load: cached data returns at once and refreshes behind; cold data waits. Errors stay the page's. */
export const warm = (cache: QueryClient, ...opts: EnsureQueryDataOptions<any, any, any, any>[]) =>
  Promise.all(
    opts.map((one) => cache.ensureQueryData({ ...one, revalidateIfStale: true }).catch(() => {})),
  );

/** A load's `fetch` for an SDK factory: SSR reads carry the cookie and replay on hydration. */
export type Ctx = { fetch?: typeof fetch };

// For remote-function writes: refresh the TanStack queries they touched.
export const invalidate = (key: QueryKey) => shared?.invalidateQueries({ queryKey: key });

/** The text of any rejected write: an SDK error body, a remote `HttpError` or an `Error`. */
export const message = (err: unknown) => {
  const one = err as { message?: string; body?: { message?: string } } | undefined;
  return one?.body?.message ?? one?.message ?? String(err);
};

const fail = (err: unknown) => Promise.reject(new Error(message(err)));

/** A remote command as a `mutationFn`, rejecting with a plain `Error`. */
export const call =
  <I, O>(fn: (input: I) => PromiseLike<O>) =>
  (input: I) =>
    Promise.resolve(fn(input)).catch(fail);

// A key's first fetch awaits the remote query as is, so hydration reuses what SSR serialized.
// Kit keeps a query cached while it is read, so any later fetch (refetch, retry) `refresh`es.
export const read =
  <O, P = never>(fn: (page: P) => PromiseLike<O>) =>
  (ctx: QueryFunctionContext) => {
    const out = fn(ctx.pageParam as P);
    const state = ctx.client.getQueryState(ctx.queryKey);
    const seen = state?.dataUpdateCount || state?.errorUpdateCount || state?.fetchFailureCount;
    if (seen && "refresh" in out && typeof out.refresh === "function") out.refresh();
    return Promise.resolve(out).catch(fail);
  };

/** What an SDK mutation factory accepts: `Opts<typeof postProjectMutation>`. */
export type Opts<T extends () => { onSuccess?: unknown }> = Pick<ReturnType<T>, "onSuccess">;

/** What a mutation factory accepts, typed from the remote command behind it. */
export type Done<T extends (input: never) => PromiseLike<unknown>> = Pick<
  MutationOptions<Awaited<ReturnType<T>>, Error, Parameters<T>[0]>,
  "onSuccess"
>;
