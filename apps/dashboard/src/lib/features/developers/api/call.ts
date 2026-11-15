import type { MutationOptions } from "@tanstack/svelte-query";

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
