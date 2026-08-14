import { eq, sql } from "drizzle-orm";
import type { PgAsyncDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { Identifier } from "../../../identifier";
import { JobTable } from "../queue.sql";
import type { Config, Port } from "../port";

/** Whatever can run drizzle queries — the app's pooled db or an open transaction. */
export type Tx = PgAsyncDatabase<PgQueryResultHKT, any>;
export type Runner = <T>(fn: (tx: Tx) => Promise<T>) => Promise<T>;

/**
 * Postgres-backed queue. `reserve` claims a row with `for update skip locked`; a dead
 * worker holds a job only until `timeout`. The transaction runner is injected.
 */
export function db(cfg: Config & { use: Runner }): Port {
  const use = cfg.use;
  const retries = cfg.retries ?? 3;
  const backoff = (cfg.backoff ?? 30) * 1000;
  const timeout = cfg.timeout ?? 60;

  return {
    async push(job) {
      const id = Identifier.create("job");
      await use((tx) =>
        tx.insert(JobTable).values({
          id,
          name: job.name,
          payload: job.payload,
          userID: job.userID,
          timeAvailable: new Date(Date.now() + (job.delay ?? 0) * 1000),
        }),
      );
      return id;
    },
    async reserve() {
      const next = sql`(
        select ${JobTable.id} from ${JobTable}
        where ${JobTable.timeFailed} is null
          and ${JobTable.timeAvailable} <= now()
          and (
            ${JobTable.timeReserved} is null
            or ${JobTable.timeReserved} < now() - make_interval(secs => ${timeout})
          )
        order by ${JobTable.timeAvailable}
        limit 1
        for update skip locked
      )`;
      const rows = await use((tx) =>
        tx
          .update(JobTable)
          .set({
            timeReserved: sql`now()`,
            timeUpdated: sql`now()`,
            attempts: sql`${JobTable.attempts} + 1`,
          })
          .where(eq(JobTable.id, next))
          .returning(),
      );
      const row = rows[0];
      if (!row) return null;
      return {
        id: row.id,
        name: row.name,
        payload: row.payload,
        userID: row.userID,
        attempts: row.attempts,
      };
    },
    async ack(job) {
      await use((tx) => tx.delete(JobTable).where(eq(JobTable.id, job.id)));
    },
    async fail(job, err) {
      await use((tx) =>
        tx
          .update(JobTable)
          .set({
            timeReserved: null,
            timeUpdated: sql`now()`,
            error: err.message,
            ...(job.attempts >= retries
              ? { timeFailed: sql`now()` }
              : { timeAvailable: new Date(Date.now() + backoff) }),
          })
          .where(eq(JobTable.id, job.id)),
      );
    },
  };
}
