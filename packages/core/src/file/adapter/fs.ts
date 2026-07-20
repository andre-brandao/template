import { mkdir, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Port } from "../port";

/** Local filesystem backend. Bun-only (dev, Docker self-host) — no filesystem on Workers/Lambda. */
export function createFsStorage(opts: { dir: string }): Port {
  const path = (key: string) => join(opts.dir, key);

  return {
    async put(key, bytes, contentType) {
      const dest = path(key);
      await mkdir(dirname(dest), { recursive: true });
      await Bun.write(dest, bytes);
      await Bun.write(`${dest}.meta`, contentType);
    },
    async get(key) {
      const file = Bun.file(path(key));
      if (!(await file.exists())) return null;
      const meta = Bun.file(`${path(key)}.meta`);
      const contentType = (await meta.exists()) ? await meta.text() : "application/octet-stream";
      return { bytes: new Uint8Array(await file.arrayBuffer()), contentType };
    },
    async del(key) {
      await unlink(path(key)).catch(() => {});
      await unlink(`${path(key)}.meta`).catch(() => {});
    },
  };
}
