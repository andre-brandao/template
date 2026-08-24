import type { HandleServerError } from "@sveltejs/kit";
import { dev } from "$app/environment";
import { VisibleError } from "@template/core/error";
import { Log } from "@template/core/util/log";

const log = Log.create({ namespace: "dashboard.hooks.server" });

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
