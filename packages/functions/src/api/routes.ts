import { Hono } from "hono";
import { logger } from "hono/logger";
import { HTTPException } from "hono/http-exception";
import { VisibleError, ErrorCodes, type ErrorResponseType } from "@template/core/error";
import { Log } from "@template/core/util/log";
import { KeyApi } from "./handler/key";
import { UserApi } from "./handler/user";
import { TodoApi } from "./handler/todo";
import { auth } from "./middleware";

const log = Log.create({ namespace: "api" });

export const app = new Hono();

// Registered before logger/auth so probes don't spam request logs or provide an actor.
app.get("/healthz", async (c) => {
  const { Database } = await import("@template/core/drizzle");
  const check = await Database.healthcheck();
  return c.json(
    { status: check.status, db: check.message, cause: check.cause },
    check.status === "ok" ? 200 : 503,
  );
});

app
  .use(logger())
  .use(async (c, next) => {
    c.header("Cache-Control", "no-store");
    return next();
  })
  .use(auth);

export const routes = app
  .route("/", UserApi.route)
  .route("/key", KeyApi.route)
  .route("/todo", TodoApi.route)
  .onError((error, c) => {
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
  });
