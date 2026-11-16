import { Context } from "@template/core/context";
import { Database } from "@template/core/drizzle";
import { Central } from "@template/core/drizzle/central";
import { Email } from "@template/core/email";
import { run } from "@template/core/jobs";
import { Kv } from "@template/core/kv";
import { redis } from "@template/core/kv/adapter/redis";
import { Queue } from "@template/core/queue";
import { Storage } from "@template/core/storage";

// Worker for the `db` driver; importing `run` from the jobs barrel registers every handler.
// A hung db round-trip can't recheck the signal, so a second signal hard-exits.
const abort = new AbortController();
function bye() {
  if (abort.signal.aborted) process.exit(1);
  abort.abort();
}
process.on("SIGINT", bye);
process.on("SIGTERM", bye);

await Context.withProviders(
  () => Queue.work({ signal: abort.signal, run }),
  Database.provider(Database.connect()),
  Storage.provider(Storage.fromEnv(process.env)),
  Email.provider(Email.fromEnv(process.env)),
  Queue.provider(Queue.Providers.db({ use: Central.use })),
  Kv.provider(Kv.fromEnv(process.env, Central.use, { redis })),
);

// The pool holds the loop open once work() returns.
process.exit(0);
