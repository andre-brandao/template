import { sequence } from "@sveltejs/kit/hooks";
import type { Handle, HandleServerError } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import { Context } from "@template/core/context";
import { Database } from "@template/core/drizzle";
import { Queue } from "@template/core/queue";
import { Storage } from "@template/core/storage";
import { Actor } from "@template/core/actor";
import { VisibleError } from "@template/core/error";
import { Log } from "@template/core/util/log";
import { dev } from "$app/environment";
import * as session from "$lib/server/session";
import * as theme from "$lib/server/theme";
import { Email } from "@template/core/email";

const log = Log.create({ namespace: "dashboard.hooks.server" });

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

const handleProviders = env.SVELTE_ADAPTER === "cloudflare" ? worker : fromEnv();

const handleAuth: Handle = async ({ event, resolve }) => {
  // Health probes don't need an actor; skip it so they don't spam logs.
  if (event.url.pathname === "/healthz") return resolve(event);

  // One lookup answers all three: is the session live, who is it, what role do they hold.
  const me = await session.read(event);
  event.locals.session = me;
  if (!me) return Actor.provide("public", {}, () => resolve(event));

  return Actor.provide("user", { userID: me.userID, role: me.role, timezone: me.timezone }, () =>
    resolve(event),
  );
};

// Read inside the callback, not before `resolve` — the root layout's load reconciles the
// cookie against the database, and `transformPageChunk` runs late enough to see that.
const handleTheme: Handle = ({ event, resolve }) =>
  resolve(event, {
    transformPageChunk: ({ html }) => html.replace("%theme%", theme.read(event)),
  });

export const handle = sequence(handleProviders, handleAuth, handleTheme);

export const handleError: HandleServerError = ({ error, event, status, message }) => {
  if (status === 404) return { message: "Not found" };

  const path = event.url.pathname;
  log.info(`Error occurred during request to ${path}: ${message}`, { status, message });

  if (error instanceof VisibleError) {
    log.warn(error.message, { status, code: error.code, path });
    return { message: error.message, code: error.code };
  }

  const detail = error instanceof Error ? error.message : String(error);
  log.warn(error instanceof Error ? "unhandled error instance" : "unhandled error type", {
    status,
    message: detail,
    path,
  });
  return { message: dev ? detail : "An unexpected error occurred." };
};
