import type { McpServer } from "@modelcontextprotocol/server";
import { Feedback } from "@template/core/feedback";
import { tools } from "../common";

export function feedback(server: McpServer) {
  tools(server)("feedback_create", Feedback.create);
}
