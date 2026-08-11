import { z } from "zod";
import { count, isNotNull, isNull, sql } from "drizzle-orm";
import { fn } from "../util/fn";
import { Actor } from "../actor";
import { Database } from "../drizzle";
import { ProjectTable } from "../project/project.sql";
import { JobTable } from "../queue/queue.sql";
import { TodoTable } from "../todo/todo.sql";
import { UserTable } from "../user/user.sql";

/**
 * Read-only operational stats for the back office. Everything here is a live query against
 * Postgres catalogs or a plain count — nothing is stored, so there is no state to keep in
 * sync and no cache to invalidate.
 */
export namespace Admin {
  export const Table = z.object({
    name: z.string(),
    rows: z.number(),
    bytes: z.number(),
  });
  export type Table = z.infer<typeof Table>;

  /**
   * Per-table size and live row estimate, biggest first, plus the database total. `n_live_tup`
   * is the planner's estimate rather than a `count(*)` — it costs nothing and is close enough
   * to answer "what is growing".
   */
  export const tables = fn(z.void(), () => {
    Actor.check({ admin: ["read"] });
    return Database.use(async (tx) => {
      const run: any = tx;
      const rows = await run.execute(sql`
        SELECT relname AS name,
               n_live_tup AS rows,
               pg_total_relation_size(relid) AS bytes
        FROM pg_stat_user_tables
        ORDER BY pg_total_relation_size(relid) DESC
      `);
      const size = await run.execute(sql`SELECT pg_database_size(current_database()) AS bytes`);
      return {
        // Postgres hands bigints back as strings over the wire; the UI wants numbers.
        tables: [...rows].map(
          (row: any): Table => ({
            name: row.name,
            rows: Number(row.rows),
            bytes: Number(row.bytes),
          }),
        ),
        bytes: Number([...size][0]?.bytes ?? 0),
      };
    });
  });

  /** Queue depth and the age of the oldest thing still waiting — the "is it stuck" number. */
  export const queue = fn(z.void(), () => {
    Actor.check({ admin: ["read"] });
    return Database.use(async (tx) => {
      const [pending, running, failed, oldest] = await Promise.all([
        tx
          .select({ n: count() })
          .from(JobTable)
          .where(isNull(JobTable.timeFailed))
          .then((r) => r[0]?.n ?? 0),
        tx
          .select({ n: count() })
          .from(JobTable)
          .where(isNotNull(JobTable.timeReserved))
          .then((r) => r[0]?.n ?? 0),
        tx
          .select({ n: count() })
          .from(JobTable)
          .where(isNotNull(JobTable.timeFailed))
          .then((r) => r[0]?.n ?? 0),
        tx
          .select({ at: sql<Date | null>`min(${JobTable.timeAvailable})` })
          .from(JobTable)
          .where(isNull(JobTable.timeFailed))
          .then((r) => r[0]?.at ?? null),
      ] as const);
      return {
        pending,
        running,
        failed,
        oldest: oldest ? new Date(oldest).toISOString() : null,
      };
    });
  });

  /** Product tallies rather than storage ones — what the instance actually holds. */
  export const counts = fn(z.void(), () => {
    Actor.check({ admin: ["read"] });
    return Database.use(async (tx) => {
      const one = (table: typeof UserTable | typeof ProjectTable | typeof TodoTable, where?: any) =>
        tx
          .select({ n: count() })
          .from(table as any)
          .where(where)
          .then((r) => r[0]?.n ?? 0);

      const [users, disabled, projects, todos, done] = await Promise.all([
        one(UserTable, isNull(UserTable.timeDeleted)),
        one(UserTable, isNotNull(UserTable.timeDeleted)),
        one(ProjectTable, isNull(ProjectTable.timeDeleted)),
        one(TodoTable, isNull(TodoTable.timeDeleted)),
        one(TodoTable, isNotNull(TodoTable.timeDone)),
      ] as const);
      return { users, disabled, projects, todos, done };
    });
  });

  /** Version, connection headroom and uptime — what you want when the pool misbehaves. */
  export const server = fn(z.void(), () => {
    Actor.check({ admin: ["read"] });
    return Database.use(async (tx) => {
      const run: any = tx;
      const rows = await run.execute(sql`
        -- server_version carries the packager's whole string ("17.10 (Debian 17.10-1...)");
        -- the leading number is the part anyone reads.
        SELECT split_part(current_setting('server_version'), ' ', 1) AS version,
               (SELECT count(*) FROM pg_stat_activity) AS connections,
               current_setting('max_connections') AS max,
               pg_postmaster_start_time() AS started
      `);
      const row = [...rows][0];
      return {
        version: row?.version ?? "unknown",
        connections: Number(row?.connections ?? 0),
        max: Number(row?.max ?? 0),
        started: row?.started ? new Date(row.started).toISOString() : null,
      };
    });
  });
}
