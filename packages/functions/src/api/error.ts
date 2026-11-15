import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { VisibleError, ErrorCodes, type ErrorResponseType } from "@template/core/error";
import { Log } from "@template/core/util/log";

const log = Log.create({ namespace: "api" });

/** Every service's `onError`: a `VisibleError` as itself, Hono's own 4xx kept, the rest a logged 500. */
export const fail: ErrorHandler = (error, c) => {
  if (error instanceof VisibleError)
    return c.json<ErrorResponseType>(error.toResponse(), error.statusCode());

  if (error instanceof HTTPException && error.status < 500)
    return c.json(
      {
        type: "validation",
        code: ErrorCodes.Validation.INVALID_PARAMETER,
        message: error.message || "Invalid request",
      },
      error.status,
    );

  log.error(error instanceof Error ? error : new Error(String(error)));
  return c.json(
    {
      type: "internal",
      code: ErrorCodes.Server.INTERNAL_ERROR,
      message: "Internal server error",
    },
    500,
  );
};
