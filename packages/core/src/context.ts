import { AsyncLocalStorage } from "node:async_hooks";

export namespace Context {
  export class NotFound extends Error {}

  export type Provider<R> = (fn: () => R) => R;

  export function withProviders<R>(fn: () => R, ...providers: Provider<R>[]): R {
    return providers.reduceRight<() => R>((next, provider) => () => provider(next), fn)();
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
