import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { McpServer, createMcpHandler } from "@modelcontextprotocol/server";
import { VisibleError, ErrorCodes, type ErrorResponseType } from "@template/core/error";
import { auth } from "../api/middleware";
import { authRequired } from "../api/common";
import { feedback } from "./tool/feedback";
import { todo } from "./tool/todo";
import { health } from "../health";

/** Where clients find the issuer. Path-suffixed too, as RFC 9728 clients ask for both. */
const META = "/.well-known/oauth-protected-resource";

function metadata(c: Context) {
  const origin = new URL(c.req.url).origin;
  return c.json({
    resource: `${origin}/mcp`,
    authorization_servers: [process.env.AUTH_URL ?? "http://localhost:3002"],
    bearer_methods_supported: ["header"],
  });
}

/** One server per request — the streamable HTTP transport is stateless. */
function server() {
  const s = new McpServer({ name: "template", version: "1.0.0" });
  todo(s);
  feedback(s);
  return s;
}

const handler = createMcpHandler(server);

export const app = new Hono()
  .route("/", health)
  .get(META, cors(), metadata)
  .get(`${META}/mcp`, cors(), metadata)
  .use(auth("mcp"))
  .all("/mcp", authRequired, (c) => handler.fetch(c.req.raw))
  .onError((error, c) => {
    if (error instanceof VisibleError) {
      // The 401 is how an MCP client learns to start OAuth: it names the metadata to read.
      if (error.statusCode() === 401)
        c.header(
          "WWW-Authenticate",
          `Bearer resource_metadata="${new URL(c.req.url).origin}${META}"`,
        );
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
