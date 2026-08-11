import { Identifier } from "../../identifier";
import type { Config, Job, Port } from "../port";

type Row = Job & { time: number; reserved: number | null; failed: boolean; error?: string };

/**
 * In-process queue: real reserve/ack/retry semantics without a database, so a worker
 * loop can be exercised in tests. Jobs die with the process.
 */
export function memory(cfg: Config = {}): Port & { rows: Row[] } {
  const retries = cfg.retries ?? 3;
  const backoff = (cfg.backoff ?? 0) * 1000;
  const timeout = (cfg.timeout ?? 60) * 1000;
  const rows: Row[] = [];

  return {
    rows,
    async push(job) {
      const id = Identifier.create("job");
      rows.push({
        id,
        name: job.name,
        payload: job.payload,
        userID: job.userID,
        attempts: 0,
        time: Date.now() + (job.delay ?? 0) * 1000,
        reserved: null,
        failed: false,
      });
      return id;
    },
    async reserve() {
      const now = Date.now();
      const row = rows.find(
        (r) => !r.failed && r.time <= now && (r.reserved === null || r.reserved < now - timeout),
      );
      if (!row) return null;
      row.reserved = now;
      row.attempts += 1;
      return {
        id: row.id,
        name: row.name,
        payload: row.payload,
        userID: row.userID,
        attempts: row.attempts,
      };
    },
    async ack(job) {
      const i = rows.findIndex((r) => r.id === job.id);
      if (i >= 0) rows.splice(i, 1);
    },
    async fail(job, err) {
      const row = rows.find((r) => r.id === job.id);
      if (!row) return;
      row.reserved = null;
      row.error = err.message;
      row.failed = row.attempts >= retries;
      row.time = Date.now() + backoff;
    },
  };
}
