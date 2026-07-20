import { tmpdir } from "node:os";
import { join } from "node:path";
import { Context } from "../context";
import { createFsStorage } from "./adapter/fs";
import { createS3Storage } from "./adapter/s3";
import { Log } from "../util/log";

export namespace Storage {
  const log = Log.create({ namespace: "core.storage" });
  export type Object = { bytes: Uint8Array; contentType: string };

  export interface Port {
    put(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
    get(key: string): Promise<Object | null>;
    del(key: string): Promise<void>;
  }

  const ctx = Context.create<Port>();

  export function provide<R>(port: Port, fn: () => R): R {
    return ctx.provide(port, fn);
  }

  /** Curried form of `provide` for composition via `Context.withProviders`. */
  export function provider(port: Port) {
    return <R>(fn: () => R) => provide(port, fn);
  }

  /**
   * Same env fallback as `Database.use()`: routes that hit the raw Hono app
   * directly (bypassing `target.ts`'s per-request wrapper — chiefly tests)
   * still get a working backend instead of an error.
   */
  export function use(): Port {
    try {
      return ctx.use();
    } catch (err) {
      if (!(err instanceof Context.NotFound)) throw err;
      return fromEnv(process.env);
    }
  }

  /**
   * Builds a `Port` from env vars for the non-Worker targets (Bun dev/self-host,
   * Lambda). `STORAGE_DRIVER=fs|s3`, default `fs`. The Cloudflare Worker target
   * doesn't use this — it wires the native R2 binding directly via
   * `storage/adapter/r2` since that's only available per-request as `env.Files`.
   */
  export function fromEnv(env: Record<string, string | undefined>): Port {
    const driver = env.STORAGE_DRIVER ?? "fs";

    if (driver === "s3") {
      log.info("using s3 storage");
      return createS3Storage({
        endpoint: required(env, "S3_ENDPOINT"),
        region: env.S3_REGION ?? "auto",
        bucket: required(env, "S3_BUCKET"),
        accessKeyId: required(env, "S3_ACCESS_KEY_ID"),
        secretAccessKey: required(env, "S3_SECRET_ACCESS_KEY"),
      });
    }
    log.info("using fs storage");

    const dir =
      env.STORAGE_DIR ??
      (env.NODE_ENV === "test" ? join(tmpdir(), "template-files-test") : "./.data/files");
    return createFsStorage({ dir });
  }

  function required(env: Record<string, string | undefined>, key: string): string {
    const value = env[key];
    if (!value) throw new Error(`Missing ${key} for STORAGE_DRIVER=s3`);
    return value;
  }
}
