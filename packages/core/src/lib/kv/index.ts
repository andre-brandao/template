import { tmpdir } from "node:os";
import { join } from "node:path";
import type { z } from "zod";
import { Context } from "../../context";
import { Log } from "../../util/log";
import type * as port from "./port";
import { file } from "./adapter/file";
import { memory } from "./adapter/memory";
import { pg, type Runner } from "./adapter/pg";

/**
 * Key-value store over a swappable driver: string values at the port, JSON and cache
 * helpers on top. Redis lives outside `Providers` (see `adapter/redis.ts`).
 */
export namespace Kv {
  const log = Log.create({ namespace: "core.kv" });

  export type Store = port.Store;

  /** The drivers, re-exported so a target only imports `Kv`. */
  export const Providers = { file, memory, pg };

  /** What callers get: the driver plus everything derivable from it. */
  export type Api = Store & {
    json: {
      /** Null when the key is missing or the value doesn't match `schema`. */
      get<S extends z.ZodType>(key: string, schema: S): Promise<z.infer<S> | null>;
      set(key: string, value: unknown, opts?: { ttl?: number }): Promise<void>;
    };
    /** The cached value, or `fn`'s result stored as JSON for `ttl` seconds. */
    remember<T>(key: string, opts: { ttl?: number }, fn: () => T | Promise<T>): Promise<T>;
  };

  function wrap(store: Store): Api {
    return {
      ...store,
      json: {
        async get(key, schema) {
          const text = await store.get(key);
          if (text === null) return null;
          const value = await Promise.resolve(text)
            .then(JSON.parse)
            .catch(() => undefined);
          const parsed = schema.safeParse(value);
          return parsed.success ? parsed.data : null;
        },
        set: (key, value, opts) => store.set(key, JSON.stringify(value), opts),
      },
      async remember(key, opts, fn) {
        const hit = await store.get(key);
        if (hit !== null) return JSON.parse(hit);
        const value = await fn();
        await store.set(key, JSON.stringify(value), opts);
        return value;
      },
    };
  }

  /** An in-memory store to hand to `provide` in tests. */
  export function fake() {
    return memory();
  }

  // Env fallback for callers that bypass a target's per-request wrapper (chiefly tests).
  const ctx = Context.port(() => fromEnv(process.env));
  export const provide = ctx.provide;
  export const provider = ctx.provider;

  export function use(): Api {
    return wrap(ctx.use());
  }

  /**
   * `KV_DRIVER=pg|memory|file|redis`, default `pg`. `pg` needs the app's transaction runner;
   * `redis` imports `"bun"`, so a Bun target passes it in `extra`.
   */
  export function fromEnv(
    env: Record<string, string | undefined>,
    database?: Runner,
    extra: Record<string, () => Store> = {},
  ): Store {
    const driver = env.KV_DRIVER ?? "pg";
    log.info("using kv driver", { driver });

    const custom = extra[driver];
    if (custom) return custom();
    if (driver === "pg") {
      if (!database) throw new Error("KV_DRIVER=pg needs a database runner: fromEnv(env, use)");
      return pg({ use: database });
    }
    if (driver === "memory") return memory();
    if (driver === "file")
      return file({
        dir:
          env.KV_DIR ??
          (env.NODE_ENV === "test" ? join(tmpdir(), "template-kv-test") : "./.data/kv"),
      });
    throw new Error(`Unknown KV_DRIVER ${driver}: use pg, memory, file, or redis on a Bun target`);
  }
}
