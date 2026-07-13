import { Hono } from "hono";
import { StreamableHTTPTransport } from "@hono/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { VisibleError, ErrorCodes, type ErrorResponseType } from "@template/core/error";
import { auth } from "../api/middleware";
import { authRequired } from "../api/common";
import { todo } from "./tool/todo";

/** One server per request — the streamable HTTP transport is stateless. */
function server() {
  const s = new McpServer({ name: "template", version: "1.0.0" });
  todo(s);
  return s;
}

export const app = new Hono()
  .use(auth)
  .all("/mcp", authRequired, async (c) => {
    const transport = new StreamableHTTPTransport();
    await server().connect(transport);
    return transport.handleRequest(c);
  })
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
