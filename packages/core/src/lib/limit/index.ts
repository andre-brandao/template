import { ErrorCodes, VisibleError } from "../../error";
import { digest, encode } from "../../util/hash";
import { Kv } from "../kv";

/** Central, typed rate-limit rules. Callers consume before doing protected work. */
export namespace Limit {
  export type Subject = Readonly<{ kind: string; value: string }>;

  export type Result = {
    allowed: boolean;
    limit: number;
    remaining: number;
    resetAfter: number;
    retryAfter?: number;
  };

  export type Store = Pick<Kv.Api, "delete" | "get" | "incr" | "set">;

  export type Policy<Options> = {
    algorithm: Algo.Type<Options>;
    options: Options;
  };

  export interface Rule {
    consume(subject: Subject, opts?: { cost?: number }): Promise<Result>;
    inspect(subject: Subject): Promise<Result>;
    reset(subject: Subject): Promise<void>;
  }

  export namespace Err {
    export class Exceeded extends VisibleError {
      readonly retryAfter: number;

      constructor(result: Result) {
        const retryAfter = result.retryAfter ?? result.resetAfter;
        super("rate_limit", ErrorCodes.RateLimit.EXCEEDED, "Rate limit exceeded", undefined, {
          limit: result.limit,
          remaining: result.remaining,
          retryAfter,
        });
        this.retryAfter = retryAfter;
      }
    }
  }

  export function subject(kind: string, value: string): Subject {
    if (!kind || !value) throw new Error("A rate-limit subject needs a kind and value");
    return { kind, value };
  }

  type Built<Tree> = {
    [Key in keyof Tree]: Tree[Key] extends Policy<infer _Options>
      ? Rule
      : Tree[Key] extends Record<string, unknown>
        ? Built<Tree[Key]>
        : never;
  };

  /** Turns nested policy data into a catalog while preserving every path in its type. */
  export function catalog<const Tree extends Record<string, unknown>>(tree: Tree): Built<Tree> {
    return build(tree) as Built<Tree>;
  }

  function build(tree: Record<string, unknown>, path: string[] = []): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(tree).map(([name, value]) => {
        if (!value || typeof value !== "object" || Array.isArray(value))
          throw new Error(`Invalid rate-limit catalog entry ${[...path, name].join(".")}`);

        const next = value as Record<string, unknown>;
        if (!("algorithm" in next) || !("options" in next))
          return [name, build(next, [...path, name])];

        const policy = next as {
          algorithm: Algo.Type<unknown>;
          options: unknown;
        };
        const id = [...path, name].join(".");
        return [name, rule(id, policy)];
      }),
    );
  }

  function rule(id: string, policy: Policy<unknown>): Rule {
    const key = async (subject: Subject) =>
      `limit:v1:${id}:${encode(await digest(`${subject.kind}:${subject.value}`))}`;

    return {
      async consume(subject, opts = {}) {
        const cost = opts.cost ?? 1;
        if (!Number.isSafeInteger(cost) || cost < 1)
          throw new Error("Rate-limit cost must be a positive integer");
        const result = await policy.algorithm.consume(
          Kv.use(),
          await key(subject),
          policy.options,
          cost,
        );
        if (!result.allowed) throw new Err.Exceeded(result);
        return result;
      },
      async inspect(subject) {
        return policy.algorithm.inspect(Kv.use(), await key(subject), policy.options);
      },
      async reset(subject) {
        await policy.algorithm.reset(Kv.use(), await key(subject), policy.options);
      },
    };
  }

  export namespace Algo {
    /** Implement this contract to add an algorithm without changing the catalog builder. */
    export interface Type<Options> {
      consume(store: Store, key: string, opts: Options, cost: number): Promise<Result>;
      inspect(store: Store, key: string, opts: Options): Promise<Result>;
      reset(store: Store, key: string, opts: Options): Promise<void>;
    }

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
    export const FixedWindow: Type<FixedOptions> = {
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
  }
}

/** The only application policy catalog. Add rules here so limits stay discoverable and typed. */
export const Limits = Limit.catalog({
  auth: {
    password: {
      algorithm: Limit.Algo.FixedWindow,
      options: { limit: 10, window: 15 * 60 },
    },
  },
});
