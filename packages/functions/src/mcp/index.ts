import { Hono } from "hono";
import { McpServer, createMcpHandler } from "@modelcontextprotocol/server";
import { VisibleError, ErrorCodes, type ErrorResponseType } from "@template/core/error";
import { auth } from "../api/middleware";
import { authRequired } from "../api/common";
import { todo } from "./tool/todo";
import { health } from "../health";

/** One server per request — the streamable HTTP transport is stateless. */
function server() {
  const s = new McpServer({ name: "template", version: "1.0.0" });
  todo(s);
  return s;
}

const handler = createMcpHandler(server);

export const app = new Hono()
  .route("/", health)
  .use(auth)
  .all("/mcp", authRequired, (c) => handler.fetch(c.req.raw))
  .onError((error, c) => {
    if (error instanceof VisibleError) {
      return c.json<ErrorResponseType>(error.toResponse(), error.statusCode());
    }
    return c.json(
      {
        type: "internal",
        code: ErrorCodes.Server.INTERNAL_ERROR,
        message: "Internal server error",
      },
      500,
    );
  });
