import type { Message, MessageBatch } from "@cloudflare/workers-types";
import { Context } from "@template/core/context";
import { Database } from "@template/core/drizzle";
import { Email } from "@template/core/email";
import { createCloudflareSender } from "@template/core/email/adapter/cloudflare";
import { Queue } from "@template/core/queue";
import { cloudflare } from "@template/core/queue/adapter/cloudflare";
import type { Job } from "@template/core/queue/port";
import { Storage } from "@template/core/storage";
import { r2 } from "@template/core/storage/adapter/r2";
import { Log } from "@template/core/util/log";
import type { EmailEnv, QueueEnv } from "../../cf";
import "@template/core/queue/jobs";

/** Handlers may enqueue follow-ups and send mail, so this worker needs both bindings. */
type Env = QueueEnv & EmailEnv;

const log = Log.create({ namespace: "queue.worker" });

/**
 * Cloudflare consumer for the queue the `cloudflare` driver pushes to. Cloudflare
 * delivers a batch and counts attempts itself, so this runs each job and acks or
 * retries it — the `reserve`/`ack` loop `work()` runs on the polling drivers has no
 * counterpart here.
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
        () => Queue.run(job),
        Database.provider(env.Hyperdrive.connectionString),
        Storage.provider(r2(env.Files)),
        Email.provider(createCloudflareSender(env.SEND_EMAIL)),
        Queue.provider(cloudflare(env.Jobs)),
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
