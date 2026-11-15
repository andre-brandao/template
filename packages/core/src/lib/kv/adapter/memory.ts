import type { Row, Store } from "../port";

/** In-process store, the one behind `Kv.fake()`. Expiry is checked on read. */
export function memory(): Store & { rows: Map<string, Row> } {
  const rows = new Map<string, Row>();
  const live = (key: string) => {
    const row = rows.get(key);
    if (!row) return null;
    if (row.expires === null || row.expires > Date.now()) return row;
    rows.delete(key);
    return null;
  };
  const expires = (ttl?: number) => (ttl === undefined ? null : Date.now() + ttl * 1000);

  return {
    rows,
    async get(key) {
      return live(key)?.value ?? null;
    },
    async set(key, value, opts) {
      rows.set(key, { value, expires: expires(opts?.ttl) });
    },
    async delete(key) {
      rows.delete(key);
    },
    async incr(key, by = 1, opts) {
      const row = live(key);
      const next = Number(row?.value ?? 0) + by;
      rows.set(key, { value: String(next), expires: row ? row.expires : expires(opts?.ttl) });
      return next;
    },
    async keys(prefix) {
      return [...rows.keys()].filter((key) => key.startsWith(prefix) && live(key));
    },
  };
}
