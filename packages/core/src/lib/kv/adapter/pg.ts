import { and, eq, gt, isNull, like, lte, or, sql } from "drizzle-orm";
import type { PgAsyncDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { KvTable } from "../kv.sql";
import type { Store } from "../port";

/** Whatever can run drizzle queries — the app's pooled db or an open transaction. */
export type Tx = PgAsyncDatabase<PgQueryResultHKT, any>;
export type Runner = <T>(fn: (tx: Tx) => Promise<T>) => Promise<T>;

/**
 * Postgres-backed store over the `kv` table. Expired rows are hidden on read and deleted
 * lazily by `get`. The transaction runner is injected.
 */
export function pg(cfg: { use: Runner }): Store {
  const use = cfg.use;
  const expires = (ttl?: number) => (ttl === undefined ? null : new Date(Date.now() + ttl * 1000));
  const live = or(isNull(KvTable.timeExpires), gt(KvTable.timeExpires, sql`now()`));
  const expired = lte(KvTable.timeExpires, sql`now()`);

  return {
    async get(key) {
      const rows = await use((tx) =>
        tx
          .select({ value: KvTable.value, expired: sql<boolean>`coalesce(${expired}, false)` })
          .from(KvTable)
          .where(eq(KvTable.key, key)),
      );
      const row = rows[0];
      if (!row) return null;
      if (!row.expired) return row.value;
      await use((tx) => tx.delete(KvTable).where(and(eq(KvTable.key, key), expired)));
      return null;
    },
    async set(key, value, opts) {
      const time = expires(opts?.ttl);
      await use((tx) =>
        tx
          .insert(KvTable)
          .values({ key, value, timeExpires: time })
          .onConflictDoUpdate({
            target: KvTable.key,
            set: { value, timeExpires: time, timeUpdated: sql`now()` },
          }),
      );
    },
    async delete(key) {
      await use((tx) => tx.delete(KvTable).where(eq(KvTable.key, key)));
    },
    async incr(key, by = 1, opts) {
      // SET reads the old row throughout, so an expired one restarts from `by` with a fresh ttl.
      const stale = sql`coalesce(${expired}, false)`;
      const rows = await use((tx) =>
        tx
          .insert(KvTable)
          .values({ key, value: String(by), timeExpires: expires(opts?.ttl) })
          .onConflictDoUpdate({
            target: KvTable.key,
            set: {
              value: sql`case when ${stale} then excluded.value else (${KvTable.value}::bigint + ${by}::bigint)::text end`,
              timeExpires: sql`case when ${stale} then excluded.time_expires else ${KvTable.timeExpires} end`,
              timeUpdated: sql`now()`,
            },
          })
          .returning({ value: KvTable.value }),
      );
      return Number(rows[0]?.value);
    },
    async keys(prefix) {
      const rows = await use((tx) =>
        tx
          .select({ key: KvTable.key })
          .from(KvTable)
          .where(and(like(KvTable.key, `${prefix.replace(/[\\%_]/g, "\\$&")}%`), live)),
      );
      return rows.map((row) => row.key);
    },
  };
}
