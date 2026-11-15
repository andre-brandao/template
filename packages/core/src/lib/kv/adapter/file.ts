import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Row, Store } from "../port";

const EXT = ".json";

/**
 * One JSON file per key under `dir` (dev, Docker self-host). The key is URI-encoded with
 * a suffix, so `/` and `..` never leave the directory. `incr` is read-modify-write.
 */
export function file(opts: { dir: string }): Store {
  const path = (key: string) => join(opts.dir, encodeURIComponent(key) + EXT);
  const expires = (ttl?: number) => (ttl === undefined ? null : Date.now() + ttl * 1000);
  const write = async (key: string, row: Row) => {
    await mkdir(opts.dir, { recursive: true });
    await writeFile(path(key), JSON.stringify(row));
  };
  const read = async (key: string) => {
    const text = await readFile(path(key), "utf8").catch(() => null);
    if (!text) return null;
    const row: Row = JSON.parse(text);
    if (row.expires === null || row.expires > Date.now()) return row;
    await unlink(path(key)).catch(() => {});
    return null;
  };

  return {
    async get(key) {
      return (await read(key))?.value ?? null;
    },
    async set(key, value, opts) {
      await write(key, { value, expires: expires(opts?.ttl) });
    },
    async delete(key) {
      await unlink(path(key)).catch(() => {});
    },
    async incr(key, by = 1, opts) {
      const row = await read(key);
      const next = Number(row?.value ?? 0) + by;
      await write(key, { value: String(next), expires: row ? row.expires : expires(opts?.ttl) });
      return next;
    },
    async keys(prefix) {
      const names = await readdir(opts.dir).catch(() => [] as string[]);
      const keys = names
        .filter((name) => name.endsWith(EXT))
        .map((name) => decodeURIComponent(name.slice(0, -EXT.length)))
        .filter((key) => key.startsWith(prefix));
      const rows = await Promise.all(keys.map(read));
      return keys.filter((_, i) => rows[i] !== null);
    },
  };
}
