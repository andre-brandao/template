import { AsyncLocalStorage } from "node:async_hooks";

export namespace Context {
  export class NotFound extends Error {}

  export type Provider<R> = (fn: () => R) => R;

  export function withProviders<R>(fn: () => R, ...providers: Provider<R>[]): R {
    return providers.reduceRight<() => R>((next, provider) => () => provider(next), fn)();
  }

  /**
   * The swappable-driver trio: `provide`/`provider` scope a port to a request, `use`
   * falls back to `env()` for callers that bypass a target's per-request wrapper
   * (chiefly tests). The fallback is cached so a stateful driver survives calls —
   * a console driver warns once, a memory queue keeps its jobs.
   */
  export function port<P>(env: () => P) {
    const ctx = create<P>();
    let fallback: P | undefined;
    return {
      provide<R>(port: P, fn: () => R): R {
        return ctx.provide(port, fn);
      },
      /** Curried form of `provide` for composition via `withProviders`. */
      provider(port: P) {
        return <R>(fn: () => R) => ctx.provide(port, fn);
      },
      use(): P {
        try {
          return ctx.use();
        } catch (err) {
          if (!(err instanceof NotFound)) throw err;
          fallback ??= env();
          return fallback;
        }
      },
    };
  }

  export function create<T>() {
    const storage = new AsyncLocalStorage<T>();
    return {
      use() {
        const result = storage.getStore();
        if (!result) {
          throw new NotFound();
        }
        return result;
      },
      provide<R>(value: T, fn: () => R) {
        return storage.run(value, fn);
      },
    };
  }
}
