import type { Handle } from "@sveltejs/kit/hooks";
import { DATABASE_URL, SVELTE_ADAPTER } from "$app/env/private";
import { Context } from "@template/core/context";
import { Database } from "@template/core/drizzle";
import { Central } from "@template/core/drizzle/central";
import { Kv } from "@template/core/kv";
import { Queue } from "@template/core/queue";
import { Storage } from "@template/core/storage";
import { Email } from "@template/core/email";
import { env as cf } from "cloudflare:workers";

// Workers forbid reusing a socket across requests, so the pool is built per request. A
// missing binding throws rather than falling back to env — a working-but-wrong deploy.
const worker: Handle = ({ event, resolve }) => {
  if (!cf.Hyperdrive || !cf.Files || !cf.Jobs)
    throw new Error("Worker is missing a Hyperdrive/Files/Jobs binding");

  return Context.withProviders(
    () => resolve(event),
    Database.provider(Database.connect(cf.Hyperdrive.connectionString)),
    Kv.provider(Kv.Providers.pg({ use: Central.use })),
    Storage.provider(Storage.Providers.r2(cf.Files)),
    Queue.provider(Queue.Providers.cloudflare(cf.Jobs)),
    Email.provider(Email.Providers.queue()),
  );
};

function fromEnv(): Handle {
  // One pool for the process, built here rather than per request — a pool per request
  // exhausts the server's connections and every query starts failing.
  const db = Database.connect(DATABASE_URL ?? Database.DEFAULT_URL);
  // Core's drivers read their own keys (STORAGE_*, QUEUE_*, KV_*); this branch never runs in workerd.
  const disks = Storage.fromEnv(process.env);
  const q = Queue.fromEnv(process.env, Central.use);
  // No redis: the server build can run under Node, which has no `"bun"`.
  const kv = Kv.fromEnv(process.env, Central.use);
  const email = Email.Providers.queue();

  return ({ event, resolve }) =>
    Context.withProviders(
      () => resolve(event),
      Database.provider(db),
      Storage.provider(disks),
      Email.provider(email),
      Queue.provider(q),
      Kv.provider(kv),
    );
}

export const providers = SVELTE_ADAPTER === "cloudflare" ? worker : fromEnv();
