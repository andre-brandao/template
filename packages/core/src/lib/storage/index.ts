import { tmpdir } from "node:os";
import { join } from "node:path";
import { Context } from "../../context";
import { Key } from "../../platform/key";
import { Log } from "../../util/log";
import type * as port from "./port";
import { fs } from "./adapter/fs";
import { memory } from "./adapter/memory";
import { r2 } from "./adapter/r2";
import { s3 } from "./adapter/s3";
import { serve } from "./adapter/serve";

/**
 * Named disks over a swappable backend: `Storage.disk()` is the default, `disk("s3")`
 * picks another. Drivers implement `Disk` (port.ts); `disk()` wraps them in the wider `Api`.
 */
export namespace Storage {
  const log = Log.create({ namespace: "core.storage" });

  export type Object = port.Object;
  export type Entry = port.Entry;
  export type Meta = port.Meta;
  export type Disk = port.Disk;
  export type Disks = {
    default: string;
    disks: Record<string, Disk>;
  };

  /** The drivers, re-exported so a target only imports `Storage`. */
  export const Providers = { fs, memory, r2, s3, serve };

  /** What callers get: the driver plus everything derivable from it. */
  export type Api = Disk & {
    exists(key: string): Promise<boolean>;
    missing(key: string): Promise<boolean>;
    size(key: string): Promise<number | null>;
    mimeType(key: string): Promise<string | null>;
    lastModified(key: string): Promise<Date | null>;
    /** Copy then delete — no backend here has an atomic move. */
    move(from: string, to: string): Promise<void>;
    /** Just the keys under `prefix`, for when the rest of the entry is noise. */
    files(prefix?: string): Promise<string[]>;
    /** Null rather than a throw when the driver can't sign, unlike Laravel. */
    temporaryUrl(
      key: string,
      opts?: { method?: "get" | "put"; expires?: number },
    ): Promise<string | null>;
  };

  function wrap<T extends Disk>(disk: T): Api & T {
    return {
      ...disk,
      exists: (key) => disk.head(key).then((meta) => meta !== null),
      missing: (key) => disk.head(key).then((meta) => meta === null),
      size: (key) => disk.head(key).then((meta) => meta?.size ?? null),
      mimeType: (key) => disk.head(key).then((meta) => meta?.contentType ?? null),
      lastModified: (key) => disk.head(key).then((meta) => meta?.lastModified ?? null),
      files: (prefix = "") => disk.list(prefix).then((rows) => rows.map((row) => row.key)),
      async move(from, to) {
        await disk.copy(from, to);
        await disk.delete(from);
      },
      async temporaryUrl(key, opts) {
        if (!disk.presign) return null;
        return disk.presign({ key, method: opts?.method ?? "get", expires: opts?.expires });
      },
    };
  }

  /** Laravel's `Storage::fake()` — an in-memory disk to hand to `provide` in tests. */
  export function fake() {
    return memory();
  }

  const ctx = Context.create<Disks>();

  /** Accepts a disk set, or a lone disk that becomes the default (the R2 binding case). */
  export function provide<R>(cfg: Disks | Disk, fn: () => R): R {
    return ctx.provide("disks" in cfg ? cfg : { default: "default", disks: { default: cfg } }, fn);
  }

  /** Curried form of `provide` for composition via `Context.withProviders`. */
  export function provider(cfg: Disks | Disk) {
    return <R>(fn: () => R) => provide(cfg, fn);
  }

  /** The named disk, or the default one. There is no `use()` — a disk is always named. */
  export function disk(name?: string): Api {
    const cfg = config();
    const found = cfg.disks[name ?? cfg.default];
    if (!found) throw new Error(`Unknown storage disk: ${name ?? cfg.default}`);
    return wrap(found);
  }

  /** Env fallback for callers that bypass a target's per-request wrapper (chiefly tests). */
  function config(): Disks {
    try {
      return ctx.use();
    } catch (err) {
      if (!(err instanceof Context.NotFound)) throw err;
      return fromEnv(process.env);
    }
  }

  /**
   * `STORAGE_DISK=fs|s3`, default `fs`. The Worker target skips this and wires its
   * per-request R2 binding directly.
   */
  export function fromEnv(env: Record<string, string | undefined>): Disks {
    const name = env.STORAGE_DISK ?? "fs";
    log.info("using storage disk", { name });

    const local = fs({
      dir:
        env.STORAGE_DIR ??
        (env.NODE_ENV === "test" ? join(tmpdir(), "template-files-test") : "./.data/files"),
    });

    const disks: Record<string, Disk> = {
      // The filesystem can't presign, so `STORAGE_URL` points at a route that can.
      fs: env.STORAGE_URL ? serve(local, { url: env.STORAGE_URL, key: Key.signing }) : local,
    };
    if (name === "s3" || env.S3_BUCKET)
      disks.s3 = s3({
        endpoint: required(env, "S3_ENDPOINT"),
        region: env.S3_REGION ?? "auto",
        bucket: required(env, "S3_BUCKET"),
        accessKeyId: required(env, "S3_ACCESS_KEY_ID"),
        secretAccessKey: required(env, "S3_SECRET_ACCESS_KEY"),
      });

    return { default: name, disks };
  }

  function required(env: Record<string, string | undefined>, key: string): string {
    const value = env[key];
    if (!value) throw new Error(`Missing ${key} for STORAGE_DISK=s3`);
    return value;
  }
}
