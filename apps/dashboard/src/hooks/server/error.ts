import type { HandleServerError } from "@sveltejs/kit/hooks";
import { dev } from "$app/env";
import { VisibleError } from "@template/core/error";
import { Log } from "@template/core/util/log";

const log = Log.create({ namespace: "dashboard.hooks.server" });

export const handleError: HandleServerError = ({ kind, error, event }) => {
  // `error(...)` bodies, kit's own 404/405s and schema failures are already safe to show.
  if (kind !== "unknown") return error;

  const path = event.url.pathname;
  if (error instanceof VisibleError) {
    log.warn(error.message, { code: error.code, path });
    return { message: error.message, code: error.code };
  }

  const detail = error instanceof Error ? error.message : String(error);
  log.warn(error instanceof Error ? "unhandled error instance" : "unhandled error type", {
    message: detail,
    path,
  });
  return { message: dev ? detail : "An unexpected error occurred." };
};
