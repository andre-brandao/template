import { Identifier } from "../../../identifier";
import type { Job, Port } from "../port";

/**
 * Laravel's `sync` driver: runs the job inline at push time, ignoring `delay`, so a failing
 * job throws at the call site and its retries run on the request path too.
 */
export function sync(run: (job: Job) => Promise<void>): Port {
  return {
    async push(job) {
      const id = Identifier.create("job");
      await run({ id, name: job.name, payload: job.payload, identity: job.identity, attempts: 1 });
      return id;
    },
    async reserve() {
      return null;
    },
    async ack() {},
    async fail() {},
  };
}
