import { Hono, type ErrorHandler } from "hono";
import { logger } from "hono/logger";
import { HTTPException } from "hono/http-exception";
import { VisibleError, ErrorCodes, type ErrorResponseType } from "@template/core/error";
import { Log } from "@template/core/util/log";
import { KeyApi } from "./handler/key";
import { UserApi } from "./handler/user";
import { TodoApi } from "./handler/todo";
import { ProjectApi } from "./handler/project";
import { FileApi } from "./handler/file";
import { HookApi } from "./handler/hook";
import { AppApi } from "./handler/app";
import { WebhookApi } from "./handler/webhook";
import { auth } from "./middleware";
import { health } from "../health";

const log = Log.create({ namespace: "api" });

// On both apps: an error thrown by `auth()` never reaches the inner router's handler.
const fail: ErrorHandler = (error, c) => {
  if (error instanceof VisibleError) {
    return c.json<ErrorResponseType>(error.toResponse(), error.statusCode());
  }

  if (error instanceof HTTPException) {
    return c.json(
      {
        type: "validation",
        code: ErrorCodes.Validation.INVALID_PARAMETER,
        message: "Invalid request",
      },
      400,
    );
  }

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

/**
 * The bare router: no bearer auth. Mounted directly by a caller that has already entered an
 * `Identity` — the dashboard's `/api` proxy, under the session cookie.
 */
export const routes = new Hono()
  .route("/", UserApi.route)
  .route("/key", KeyApi.route)
  .route("/todo", TodoApi.route)
  .route("/project", ProjectApi.route)
  .route("/file", FileApi.route)
  .route("/hook", HookApi.route)
  .route("/app", AppApi.route)
  .route("/webhook", WebhookApi.route)
  .onError(fail);

export const app = new Hono()
  // Mounted before logger/auth so probes don't spam request logs or provide an actor.
  .route("/", health)
  .use(logger())
  .use(async (c, next) => {
    c.header("Cache-Control", "no-store");
    return next();
  })
  .use(auth())
  .route("/", routes)
  .onError(fail);

/** `routes` under `/api`, for a host that already entered an `Identity` (the dashboard hook). */
export const embed = new Hono().route("/api", routes);
