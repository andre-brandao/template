import { Hono } from "hono";
import { logger } from "hono/logger";
import { KeyApi } from "./handler/key";
import { UserApi } from "./handler/user";
import { TodoApi } from "./handler/todo";
import { InsightsApi } from "./handler/insights";
import { ProjectApi } from "./handler/project";
import { FileApi } from "./handler/file";
import { HookApi } from "./handler/hook";
import { auth } from "./middleware";
import { health } from "../health";
import { fail } from "./error";

/**
 * The bare router: no bearer auth. Mounted directly by a caller that has already entered an
 * `Identity` — the dashboard's `/api` proxy, under the session cookie.
 */
export const routes = new Hono()
  .route("/", UserApi.route)
  .route("/key", KeyApi.route)
  .route("/todo", TodoApi.route)
  .route("/insights", InsightsApi.route)
  .route("/project", ProjectApi.route)
  .route("/file", FileApi.route)
  .route("/hook", HookApi.route)
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
