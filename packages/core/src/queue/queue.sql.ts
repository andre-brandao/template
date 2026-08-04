import { index, integer, jsonb, pgTable as table, text } from "drizzle-orm/pg-core";
import { id, timestamp, timestamps, ulid } from "../drizzle/types";

export const JobTable = table(
  "job",
  {
    id: id(),
    ...timestamps,
    name: text().notNull(),
    payload: jsonb().notNull().default({}),
    userID: ulid("user_id"),
    attempts: integer().notNull().default(0),
    error: text(),
    /** When the job becomes runnable — push delay and retry backoff both move it forward. */
    timeAvailable: timestamp("time_available").notNull().defaultNow(),
    /** Set while a worker holds the job; cleared on release, stale ones are reclaimed. */
    timeReserved: timestamp("time_reserved"),
    /** Set when retries run out. Buried rows are kept so failures stay inspectable. */
    timeFailed: timestamp("time_failed"),
  },
  (table) => [index("job_reserve").on(table.timeFailed, table.timeAvailable)],
);
