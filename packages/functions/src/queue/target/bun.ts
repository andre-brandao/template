import { Context } from "@template/core/context";
import { Database } from "@template/core/drizzle";
import { Email } from "@template/core/email";
import { createConsoleSender } from "@template/core/email/adapter/console";
import { run } from "@template/core/jobs";
import { Queue } from "@template/core/queue";
import { db } from "@template/core/queue/adapter/db";
import { Storage } from "@template/core/storage";

/**
 * Worker process for the `db` driver — the piece `QUEUE_DRIVER=sync` doesn't need.
 * `run` comes from the jobs barrel, so importing it registers every handler this
 * loop dispatches to.
 */
const abort = new AbortController();
process.on("SIGINT", () => abort.abort());
process.on("SIGTERM", () => abort.abort());

await Context.withProviders(
  () => Queue.work({ signal: abort.signal, run }),
  Database.provider(process.env.DATABASE_URL ?? Database.DEFAULT_URL),
  Storage.provider(Storage.fromEnv(process.env)),
  Email.provider(createConsoleSender()),
  Queue.provider(db({ use: Database.use })),
);
