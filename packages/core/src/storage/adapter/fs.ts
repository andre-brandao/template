import { mkdir, readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Disk } from "../port";

/** Local filesystem disk (dev, Docker self-host) — no filesystem on Workers/Lambda. */
export function fs(opts: { dir: string }): Disk {
  const path = (key: string) => join(opts.dir, key);
  const type = async (key: string) =>
    await readFile(`${path(key)}.meta`, "utf8").catch(() => "application/octet-stream");
  const write = async (key: string, bytes: Uint8Array, contentType: string) => {
    const dest = path(key);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, bytes);
    await writeFile(`${dest}.meta`, contentType);
  };

  return {
    put: write,
    async get(key) {
      const bytes = await readFile(path(key)).catch(() => null);
      if (!bytes) return null;
      return { bytes, contentType: await type(key) };
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
      const bytes = await readFile(path(from)).catch(() => null);
      if (!bytes) throw new Error(`No such key: ${from}`);
      await write(to, bytes, await type(from));
    },
  };
}
