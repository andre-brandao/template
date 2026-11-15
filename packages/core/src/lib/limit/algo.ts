import type { Algorithm, Result } from "./port";

export type FixedOptions = { limit: number; window: number };

function fixed(opts: FixedOptions, key: string) {
  if (!Number.isSafeInteger(opts.limit) || opts.limit < 1)
    throw new Error("A fixed-window limit must be a positive integer");
  if (!Number.isSafeInteger(opts.window) || opts.window < 1)
    throw new Error("A fixed-window duration must be positive seconds");

  const span = opts.window * 1000;
  const now = Date.now();
  const reset = Math.ceil((span - (now % span)) / 1000);
  return { key: `${key}:${Math.floor(now / span)}`, reset };
}

function result(opts: FixedOptions, count: number, resetAfter: number): Result {
  const allowed = count <= opts.limit;
  return {
    allowed,
    limit: opts.limit,
    remaining: Math.max(0, opts.limit - count),
    resetAfter,
    ...(allowed ? {} : { retryAfter: resetAfter }),
  };
}

/** Atomic fixed-window counter. KV decides whether state is local or distributed. */
export const FixedWindow: Algorithm<FixedOptions> = {
  async consume(store, key, opts, cost) {
    const state = fixed(opts, key);
    const count = await store.incr(state.key, cost, { ttl: state.reset + 1 });
    return result(opts, count, state.reset);
  },
  async inspect(store, key, opts) {
    const state = fixed(opts, key);
    return result(opts, Number((await store.get(state.key)) ?? 0), state.reset);
  },
  async reset(store, key, opts) {
    await store.delete(fixed(opts, key).key);
  },
};
