import { z } from "zod";
import { and, asc, count, ilike, isNotNull, isNull, or, sql, type SQL } from "drizzle-orm";
import { fn } from "../../util/fn";
import { iso } from "../../util/fmt";
import { Actor } from "../../actor";
import { Common } from "../../common";
import { Database } from "../../drizzle";
import { order } from "../../drizzle/order";
import { ProjectTable } from "../../project/project.sql";
import { JobTable } from "../../lib/queue/queue.sql";
import { TodoTable } from "../../todo/todo.sql";
import { User } from "../../user";
import { UserTable } from "../../user/user.sql";

/** The back office: the account directory, plus read-only stats queried live. */
export namespace Admin {
  /** Every account, paginated. Carries the role, and can surface disabled ones. */
  export const users = fn(
    Common.Query(["name", "email", "role", "timeCreated"]).extend({
      search: z.string().optional(),
      /** Include disabled accounts, which are hidden by default like every other soft delete. */
      deleted: z.boolean().optional(),
    }),
    (input) => {
      Actor.check({ admin: ["read"] });
      const { page, pageSize, limit, offset } = Common.page(input);
      const where = and(
        input.deleted ? undefined : isNull(UserTable.timeDeleted),
        input.search
          ? or(
              ilike(UserTable.name, `%${input.search}%`),
              ilike(UserTable.email, `%${input.search}%`),
            )
          : undefined,
      );
      return Database.use(async (tx) => {
        const [rows, totalRows] = await Promise.all([
          tx
            .select()
            .from(UserTable)
            .where(where)
            .orderBy(...order(UserTable, input.sort, asc(UserTable.name)))
            .limit(limit)
            .offset(offset),
          tx.select({ total: count() }).from(UserTable).where(where),
        ] as const);
        return {
          data: rows.map(User.serialize),
          page,
          pageSize,
          total: totalRows[0]?.total ?? 0,
        };
      });
    },
  );

  /** Catalog query the builder can't express; the union `tx` type forces the cast. */
  const raw = (query: SQL) => Database.use((tx): Promise<any[]> => (tx as any).execute(query));

  export const Table = z.object({
    name: z.string(),
    rows: z.number(),
    bytes: z.number(),
  });
  export type Table = z.infer<typeof Table>;

  /** Per-table size and row estimate (planner's `n_live_tup` — cheap), plus the db total. */
  export const tables = fn(z.void(), async () => {
    Actor.check({ admin: ["read"] });
    const [rows, size] = await Promise.all([
      raw(sql`
        SELECT relname AS name,
               n_live_tup AS rows,
               pg_total_relation_size(relid) AS bytes
        FROM pg_stat_user_tables
        ORDER BY pg_total_relation_size(relid) DESC
      `),
      raw(sql`SELECT pg_database_size(current_database()) AS bytes`),
    ] as const);
    return {
      // Postgres hands bigints back as strings over the wire; the UI wants numbers.
      tables: [...rows].map(
        (row): Table => ({
          name: row.name,
          rows: Number(row.rows),
          bytes: Number(row.bytes),
        }),
      ),
      bytes: Number([...size][0]?.bytes ?? 0),
    };
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
        oldest: iso(oldest),
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
  export const server = fn(z.void(), async () => {
    Actor.check({ admin: ["read"] });
    const rows = await raw(sql`
      -- server_version carries the packager's whole string; keep the leading number.
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
      started: iso(row?.started),
    };
  });
}
