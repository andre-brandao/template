import { Context } from "@template/core/context";
import { Database } from "@template/core/drizzle";
import { Email } from "@template/core/email";
import { createConsoleSender } from "@template/core/email/adapter/console";
import { Queue } from "@template/core/queue";
import { db } from "@template/core/queue/adapter/db";
import { Storage } from "@template/core/storage";
import "@template/core/queue/jobs";

/**
 * Worker process for the `db` driver — the piece `QUEUE_DRIVER=sync` doesn't need.
 * Importing `queue/jobs` is what registers the handlers this loop dispatches to.
 */
const abort = new AbortController();
process.on("SIGINT", () => abort.abort());
process.on("SIGTERM", () => abort.abort());

await Context.withProviders(
  () => Queue.work({ signal: abort.signal }),
  Database.provider(process.env.DATABASE_URL ?? Database.DEFAULT_URL),
  Storage.provider(Storage.fromEnv(process.env)),
  Email.provider(createConsoleSender()),
  Queue.provider(db()),
);
