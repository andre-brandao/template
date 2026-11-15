import { index, integer, jsonb, snakeCase, text } from "drizzle-orm/pg-core";
import { id, timestamp, timestamps } from "../../drizzle/types";

export const JobTable = snakeCase.table(
  "job",
  {
    id: id(),
    ...timestamps,
    name: text().notNull(),
    payload: jsonb().notNull().default({}),
    // Opaque to the queue: whoever pushed, as `Identity.stamp()` wrote it. Null for system.
    identity: jsonb(),
    attempts: integer().notNull().default(0),
    error: text(),
    /** When the job becomes runnable — push delay and retry backoff both move it forward. */
    timeAvailable: timestamp().notNull().defaultNow(),
    /** Set while a worker holds the job; cleared on release, stale ones are reclaimed. */
    timeReserved: timestamp(),
    /** Set when retries run out. Buried rows are kept so failures stay inspectable. */
    timeFailed: timestamp(),
  },
  (table) => [index("job_reserve").on(table.timeFailed, table.timeAvailable)],
);
