import type { Queue } from "@cloudflare/workers-types";
import { Identifier } from "../../../identifier";
import type { Job, Port } from "../port";

/** Only `send` is needed, so a producer is anything that can send — the binding included. */
export type Producer = Pick<Queue<Job>, "send">;

/**
 * Native Cloudflare Queues binding — push only. Batches are delivered to the consumer
 * worker, so nothing to reserve; retries/DLQ come from the queue's own settings.
 */
export function cloudflare(binding: Producer): Port {
  return {
    async push(job) {
      const id = Identifier.create("job");
      await binding.send(
        { id, name: job.name, payload: job.payload, userID: job.userID, attempts: 0 },
        { delaySeconds: job.delay },
      );
      return id;
    },
    async reserve() {
      return null;
    },
    async ack() {},
    async fail() {},
  };
}
