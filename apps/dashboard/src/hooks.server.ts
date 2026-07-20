import { sequence } from "@sveltejs/kit/hooks";
import type { Handle, HandleServerError } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import { Database } from "@template/core/drizzle";
import { Storage } from "@template/core/storage";
import { createR2Storage } from "@template/core/storage/adapter/r2";
import { Actor } from "@template/core/actor";
import { VisibleError } from "@template/core/error";
import { Log } from "@template/core/util/log";
import { dev } from "$app/environment";
import { read } from "$lib/server/session";

const log = Log.create({ namespace: "dashboard.hooks.server" });

const handleDb: Handle = ({ event, resolve }) => {
  // On Cloudflare the Hyperdrive binding exposes a pooled connection string at runtime;
  // fall back to DATABASE_URL for local/node dev where the binding is absent.
  const url =
    event.platform?.env?.Hyperdrive?.connectionString ?? env.DATABASE_URL ?? Database.DEFAULT_URL;
  return Database.provide(url, () => resolve(event));
};

const handleStorage: Handle = ({ event, resolve }) => {
  if (event.platform?.env?.Files) {
    return Storage.provide(createR2Storage(event.platform.env.Files), () => resolve(event));
  }

  return Storage.provide(Storage.fromEnv(env), () => resolve(event));
};

const handleAuth: Handle = async ({ event, resolve }) => {
  // Health probes don't need an actor; skip it so they don't spam logs.
  if (event.url.pathname === "/healthz") return resolve(event);

  const session = await read(event);
  event.locals.session = session;
  if (!session) return Actor.provide("public", {}, () => resolve(event));

  return Actor.provide("user", { userID: session.userID }, () => resolve(event));
};

export const handle = sequence(handleDb, handleStorage, handleAuth);

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
