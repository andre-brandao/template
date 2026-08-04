import { mkdir, readdir, stat, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Disk } from "../port";

/** Local filesystem disk. Bun-only (dev, Docker self-host) — no filesystem on Workers/Lambda. */
export function fs(opts: { dir: string }): Disk {
  const path = (key: string) => join(opts.dir, key);
  const type = async (key: string) => {
    const meta = Bun.file(`${path(key)}.meta`);
    return (await meta.exists()) ? await meta.text() : "application/octet-stream";
  };

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
      return { bytes: new Uint8Array(await file.arrayBuffer()), contentType: await type(key) };
    },
    async delete(key) {
      await unlink(path(key)).catch(() => {});
      await unlink(`${path(key)}.meta`).catch(() => {});
    },
    async head(key) {
      const info = await stat(path(key)).catch(() => null);
      if (!info?.isFile()) return null;
      return {
        key,
        size: info.size,
        contentType: await type(key),
        lastModified: info.mtime,
      };
    },
    async list(prefix) {
      // Keys are `/`-joined, which is also the separator here — this disk is posix-only.
      const names = await readdir(opts.dir, { recursive: true }).catch(() => [] as string[]);
      const rows = await Promise.all(
        names
          .filter((name) => !name.endsWith(".meta") && name.startsWith(prefix))
          .map(async (key) => {
            const info = await stat(path(key)).catch(() => null);
            if (!info?.isFile()) return null;
            return { key, size: info.size, lastModified: info.mtime };
          }),
      );
      return rows.filter((row) => row !== null);
    },
    async copy(from, to) {
      const src = Bun.file(path(from));
      if (!(await src.exists())) throw new Error(`No such key: ${from}`);
      await mkdir(dirname(path(to)), { recursive: true });
      await Bun.write(path(to), src);
      await Bun.write(`${path(to)}.meta`, await type(from));
    },
  };
}
