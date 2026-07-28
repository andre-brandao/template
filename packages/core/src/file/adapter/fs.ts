import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Port } from "../port";

/** Local filesystem backend (dev, Docker self-host) — no filesystem on Workers/Lambda. */
export function createFsStorage(opts: { dir: string }): Port {
  const path = (key: string) => join(opts.dir, key);

  return {
    async put(key, bytes, contentType) {
      const dest = path(key);
      await mkdir(dirname(dest), { recursive: true });
      await writeFile(dest, bytes);
      await writeFile(`${dest}.meta`, contentType);
    },
    async get(key) {
      const bytes = await readFile(path(key)).catch(() => null);
      if (!bytes) return null;
      const contentType = await readFile(`${path(key)}.meta`, "utf8").catch(
        () => "application/octet-stream",
      );
      return { bytes: new Uint8Array(bytes), contentType };
    },
    async del(key) {
      await unlink(path(key)).catch(() => {});
      await unlink(`${path(key)}.meta`).catch(() => {});
    },
  };
}
