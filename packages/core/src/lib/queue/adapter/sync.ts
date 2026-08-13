import { Identifier } from "../../../identifier";
import type { Job, Port } from "../port";

/**
 * Laravel's `sync` driver: runs the job inline at push time, so a failing job throws
 * at the call site and there is nothing for a worker to reserve. The default in dev
 * and tests, where a second process would be noise.
 */
export function sync(run: (job: Job) => Promise<void>): Port {
  return {
    async push(job) {
      const id = Identifier.create("job");
      await run({ id, name: job.name, payload: job.payload, userID: job.userID, attempts: 1 });
      return id;
    },
    async reserve() {
      return null;
    },
    async ack() {},
    async fail() {},
  };
}
