import { browser } from "$app/environment";
import {
  MutationCache,
  QueryClient,
  matchQuery,
  type EnsureQueryDataOptions,
  type MutationOptions,
  type QueryKey,
} from "@tanstack/svelte-query";
import { client } from "@template/sdk/query/client.gen";

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

// For remote-function writes: refresh the TanStack queries they touched.
export const invalidate = (key: QueryKey) => shared?.invalidateQueries({ queryKey: key });

// A remote function rejects with an `HttpError`, which carries no `message`; the views read one.
export const call =
  <I, O>(fn: (input: I) => PromiseLike<O>) =>
  (input: I) =>
    Promise.resolve(fn(input)).catch((err) =>
      Promise.reject(new Error(err?.body?.message ?? String(err))),
    );

/** What a mutation factory accepts, typed from the remote command behind it. */
export type Done<T extends (input: never) => PromiseLike<unknown>> = Pick<
  MutationOptions<Awaited<ReturnType<T>>, Error, Parameters<T>[0]>,
  "onSuccess"
>;
