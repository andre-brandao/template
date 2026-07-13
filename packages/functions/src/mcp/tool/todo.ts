import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Todo } from "@template/core/todo";
import { text } from "../common";

export function todo(server: McpServer) {
  server.registerTool(
    "todo_list",
    {
      title: "List todos",
      description:
        "List the current user's todos, optionally filtered by status or search. Paginated.",
      inputSchema: {
        q: z.string().optional(),
        status: Todo.Status.array().optional(),
        page: z.number().min(1).optional(),
        pageSize: z.number().min(1).max(100).optional(),
      },
    },
    async (input) => text(await Todo.list(input)),
  );

  server.registerTool(
    "todo_get",
    {
      title: "Get todo",
      description: "Fetch a single todo by id.",
      inputSchema: { id: z.string() },
    },
    async (input) => text(await Todo.fromID(input.id)),
  );

  server.registerTool(
    "todo_create",
    {
      title: "Create todo",
      description: "Create a todo for the current user.",
      inputSchema: Todo.create.schema.shape,
    },
    async (input) => {
      const id = await Todo.create(input);
      return text(await Todo.fromID(id));
    },
  );

  server.registerTool(
    "todo_update",
    {
      title: "Update todo",
      description: "Update a todo's title, status or due date.",
      inputSchema: Todo.update.schema.shape,
    },
    async (input) => {
      await Todo.update(input);
      return text(await Todo.fromID(input.id));
    },
  );

  server.registerTool(
    "todo_remove",
    {
      title: "Delete todo",
      description: "Soft-delete a todo.",
      inputSchema: { id: z.string() },
    },
    async (input) => {
      await Todo.remove(input.id);
      return text("ok");
    },
  );
}
