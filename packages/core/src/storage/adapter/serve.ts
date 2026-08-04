import { sign, verify } from "../../util/sign";
import type { Disk } from "../port";

export type Config = {
  /** Absolute URL of the route that serves the bytes, e.g. `https://api.example.com/file/signed`. */
  url: string;
  /** The active signing key. Async and per-call so it can come from the database. */
  key: () => Promise<{ id: string; secret: string }>;
};

/**
 * Laravel's `local` driver with `serve => true`: wraps a disk that can't sign — the
 * filesystem, the native R2 binding — so `temporaryUrl` still returns something. The
 * URL points back at the app rather than the backend, and the signature stands in for
 * the session, so the route handing over the bytes needs no auth of its own.
 */
export function serve(disk: Disk, opts: Config): Disk {
  return {
    ...disk,
    async presign(input) {
      if (input.method !== "get")
        throw new Error("serve() signs downloads only, not direct uploads");

      const expires = Math.floor(Date.now() / 1000) + (input.expires ?? 3600);
      const key = await opts.key();
      const target = new URL(opts.url);
      target.searchParams.set("key", input.key);
      target.searchParams.set("expires", String(expires));
      // Which key signed this, so rotation doesn't invalidate links already handed out.
      target.searchParams.set("kid", key.id);
      target.searchParams.set("sig", await sign(key.secret, input.key, expires));
      return target.toString();
    },
  };
}

/**
 * The route's half of `serve` — whether these params were minted by us and are still
 * live. `secret` is the one behind `params.kid`, which `Key.secret` resolves.
 */
export function check(params: { key: string; expires: number; sig: string }, secret: string) {
  return verify(secret, params.key, params.expires, params.sig);
}
