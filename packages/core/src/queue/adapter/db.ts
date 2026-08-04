import { eq, sql } from "drizzle-orm";
import { Database } from "../../drizzle";
import { Identifier } from "../../identifier";
import { JobTable } from "../queue.sql";
import type { Config, Port } from "../port";

/**
 * Postgres-backed queue. `reserve` claims one row with `for update skip locked`, so
 * concurrent workers never hand out the same job, and a worker that dies mid-job only
 * holds it until `timeout` passes.
 */
export function db(cfg: Config = {}): Port {
  const retries = cfg.retries ?? 3;
  const backoff = (cfg.backoff ?? 0) * 1000;
  const timeout = cfg.timeout ?? 60;

  return {
    async push(job) {
      const id = Identifier.create("job");
      await Database.use((tx) =>
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
      const rows = await Database.use((tx) =>
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
      await Database.use((tx) => tx.delete(JobTable).where(eq(JobTable.id, job.id)));
    },
    async fail(job, err) {
      await Database.use((tx) =>
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
