import type { Disk, Object } from "../port";

type Row = Object & { time: Date };

/** In-process disk, the one behind `Storage.fake()`. No filesystem, no network. */
export function memory(): Disk & { objects: Map<string, Row> } {
  const objects = new Map<string, Row>();
  const meta = (key: string, row: Row) => ({
    key,
    size: row.bytes.length,
    contentType: row.contentType,
    lastModified: row.time,
  });

  return {
    objects,
    async put(key, bytes, contentType) {
      objects.set(key, { bytes, contentType, time: new Date() });
    },
    async get(key) {
      const row = objects.get(key);
      return row ? { bytes: row.bytes, contentType: row.contentType } : null;
    },
    async delete(key) {
      objects.delete(key);
    },
    async head(key) {
      const row = objects.get(key);
      return row ? meta(key, row) : null;
    },
    async list(prefix) {
      return [...objects]
        .filter(([key]) => key.startsWith(prefix))
        .map(([key, row]) => meta(key, row));
    },
    async copy(from, to) {
      const row = objects.get(from);
      if (!row) throw new Error(`No such key: ${from}`);
      objects.set(to, { ...row, time: new Date() });
    },
  };
}
