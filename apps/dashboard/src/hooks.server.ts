import { sequence } from "@sveltejs/kit/hooks";
import type { Handle, HandleServerError } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import { Context } from "@template/core/context";
import { Database } from "@template/core/drizzle";
import { Storage } from "@template/core/storage";
import { r2 } from "@template/core/storage/adapter/r2";
import { Actor } from "@template/core/actor";
import { VisibleError } from "@template/core/error";
import { Log } from "@template/core/util/log";
import { dev } from "$app/environment";
import * as session from "$lib/server/session";
import * as theme from "$lib/server/theme";

const log = Log.create({ namespace: "dashboard.hooks.server" });

// Hyperdrive and R2 are only reachable through `event.platform`, per request — so the
// Worker is the one target that has to build its providers inside the closure. A missing
// binding throws rather than falling back to DATABASE_URL and local disk, which would be
// a working-but-wrong deploy.
const worker: Handle = ({ event, resolve }) => {
  const cf = event.platform?.env;
  if (!cf?.Hyperdrive || !cf.Files) throw new Error("Worker is missing a Hyperdrive/Files binding");

  return Context.withProviders(
    () => resolve(event),
    Database.provider(cf.Hyperdrive.connectionString),
    Storage.provider(r2(cf.Files)),
  );
};

// Everywhere else the config comes from env, which can't change after boot: read it once
// and close over it. Safe at module scope — SvelteKit fills `$env/dynamic/private` before
// it imports this file.
function fromEnv(): Handle {
  const url = env.DATABASE_URL ?? Database.DEFAULT_URL;
  const disks = Storage.fromEnv(env);

  return ({ event, resolve }) =>
    Context.withProviders(() => resolve(event), Database.provider(url), Storage.provider(disks));
}

const handleProviders = env.SVELTE_ADAPTER === "cloudflare" ? worker : fromEnv();

const handleAuth: Handle = async ({ event, resolve }) => {
  // Health probes don't need an actor; skip it so they don't spam logs.
  if (event.url.pathname === "/healthz") return resolve(event);

  const me = await session.read(event);
  event.locals.session = me;
  if (!me) return Actor.provide("public", {}, () => resolve(event));

  return Actor.provide("user", { userID: me.userID }, () => resolve(event));
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
