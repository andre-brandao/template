import { Context } from "@template/core/context";
import { Database } from "@template/core/drizzle";
import { Email } from "@template/core/email";
import { run } from "@template/core/jobs";
import { Queue } from "@template/core/queue";
import { Storage } from "@template/core/storage";

/**
 * Worker process for the `db` driver — the piece `QUEUE_DRIVER=sync` doesn't need.
 * `run` comes from the jobs barrel, so importing it registers every handler this
 * loop dispatches to.
 */
// A hung db round-trip leaves the loop unable to recheck the signal, so a second
// signal hard-exits rather than leaving an immortal worker behind.
const abort = new AbortController();
function bye() {
  if (abort.signal.aborted) process.exit(1);
  abort.abort();
}
process.on("SIGINT", bye);
process.on("SIGTERM", bye);

await Context.withProviders(
  () => Queue.work({ signal: abort.signal, run }),
  Database.provider(Database.create()),
  Storage.provider(Storage.fromEnv(process.env)),
  Email.provider(Email.fromEnv(process.env)),
  Queue.provider(Queue.Providers.db({ use: Database.use })),
);

// The pool holds the loop open once work() returns.
process.exit(0);
