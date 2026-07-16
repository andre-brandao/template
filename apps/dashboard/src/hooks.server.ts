import { sequence } from "@sveltejs/kit/hooks";
import type { Handle, HandleServerError } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import { Database } from "@template/core/drizzle";
import { Actor } from "@template/core/actor";
import { Auth } from "@template/core/user/auth";
import { VisibleError } from "@template/core/error";
import { Log } from "@template/core/util/log";
import { dev } from "$app/environment";

const log = Log.create({ namespace: "dashboard.hooks.server" });


const handleDb: Handle = ({ event, resolve }) => {
  // On Cloudflare the Hyperdrive binding exposes a pooled connection string at runtime;
  // fall back to DATABASE_URL for local/node dev where the binding is absent.
  const url =
    event.platform?.env?.Hyperdrive?.connectionString ?? env.DATABASE_URL ?? Database.DEFAULT_URL;
  return Database.provide(url, () => resolve(event));
};

const handleAuth: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get("token");
  event.locals.token = token;

  const userID = token ? await Auth.verify(token) : null;
  if (!userID) return Actor.provide("public", {}, () => resolve(event));

  return Actor.provide("user", { userID }, () => resolve(event));
};

export const handle = sequence(handleDb, handleAuth);

export const handleError: HandleServerError = async ({ error, event, status, message }) => {
  if (status === 404) {
    return { message: "Not found" };
  }
  log.info(`Error occurred during request to ${event.url.pathname}: ${message}`, {
    status,
    message,
  });
  if (error instanceof VisibleError) {
    log.warn(error.message, {
      status,
      code: error.code,
      path: event.url.pathname,
    });
    return {
      message: error.message,
      code: error.code,
    };
  }

  if (error instanceof Error) {
    log.warn("unhandled error instance", {
      status,
      message: error.message,
      event: event.url.pathname,
    });
    if (dev) {
      return { message: error.message };
    }
    return { message: "An unexpected error occurred." };
  }

  log.warn("unhandled error type", {
    status,
    message,
    event: event.url.pathname,
    error: String(error),
  });
  if (dev) {
    return { message: String(error) };
  }
  return { message: "An unexpected error occurred." };
};
