import type { Message, MessageBatch } from "@cloudflare/workers-types";
import { Context } from "@template/core/context";
import { Database } from "@template/core/drizzle";
import { Email } from "@template/core/email";
import { Queue } from "@template/core/queue";
import type { Job } from "@template/core/queue/port";
import { Storage } from "@template/core/storage";
import { Log } from "@template/core/util/log";
import { run } from "@template/core/jobs";
import type { EmailEnv, QueueEnv } from "../../cf";

/** Handlers may enqueue follow-ups and send mail, so this worker needs both bindings. */
type Env = QueueEnv & EmailEnv;

const log = Log.create({ namespace: "queue.worker" });

/**
 * Cloudflare consumer for the `cloudflare` driver's queue. Cloudflare delivers batches
 * and counts attempts, so this just runs each job and acks or retries.
 */
export default {
  async queue(batch: MessageBatch<Job>, env: Env) {
    await Promise.all(batch.messages.map((msg) => handle(msg, env)));
  },
};

/** One message, contained: a thrown handler retries that job alone, not the batch. */
async function handle(msg: Message<Job>, env: Env) {
  const job = { ...msg.body, attempts: msg.attempts };
  const err = await Promise.resolve()
    .then(() =>
      Context.withProviders(
        () => run(job),
        Database.provider(env.Hyperdrive.connectionString),
        Storage.provider(Storage.Providers.r2(env.Files)),
        Email.provider(Email.Providers.cloudflare(env.SEND_EMAIL)),
        Queue.provider(Queue.Providers.cloudflare(env.Jobs)),
      ),
    )
    .then(
      () => null,
      (e) => (e instanceof Error ? e : new Error(String(e))),
    );
  if (!err) return msg.ack();

  log.warn("job failed", { name: job.name, id: job.id, attempts: job.attempts });
  log.error(err);
  msg.retry();
}
