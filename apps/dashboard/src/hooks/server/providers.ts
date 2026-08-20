import type { Handle } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import { Context } from "@template/core/context";
import { Database } from "@template/core/drizzle";
import { Queue } from "@template/core/queue";
import { Storage } from "@template/core/storage";
import { Email } from "@template/core/email";

// Bindings only exist on `event.platform`, per request. A missing one throws rather
// than falling back to env — a working-but-wrong deploy.
const worker: Handle = ({ event, resolve }) => {
  const cf = event.platform?.env;
  if (!cf?.Hyperdrive || !cf.Files || !cf.Jobs)
    throw new Error("Worker is missing a Hyperdrive/Files/Jobs binding");

  return Context.withProviders(
    () => resolve(event),
    // Fresh pool per request: Workers forbid reusing a socket across them.
    Database.provider(Database.connect(cf.Hyperdrive.connectionString)),
    Storage.provider(Storage.Providers.r2(cf.Files)),
    Queue.provider(Queue.Providers.cloudflare(cf.Jobs)),
  );
};

function fromEnv(): Handle {
  // One pool for the process, built here rather than per request — a pool per request
  // exhausts the server's connections and every query starts failing. PG_RELEASE marks a
  // single-connection backend (pglite), where holding it idle locks out the api/auth processes.
  const db = Database.connect(
    env.DATABASE_URL ?? Database.DEFAULT_URL,
    env.PG_RELEASE === "true" ? { idle_timeout: 1 } : {},
  );
  const disks = Storage.fromEnv(env);
  const q = Queue.fromEnv(env, Database.use);
  const email = Email.Providers.queue();

  return ({ event, resolve }) =>
    Context.withProviders(
      () => resolve(event),
      Database.provider(db),
      Storage.provider(disks),
      Email.provider(email),
      // QUEUE_DRIVER=db needs the transaction runner, so it can't come from the env fallback.
      Queue.provider(q),
    );
}

export const providers = env.SVELTE_ADAPTER === "cloudflare" ? worker : fromEnv();
